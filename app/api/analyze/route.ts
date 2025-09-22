import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, imageBase64 } = await request.json();

    // Validate input
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Prepare Python script path
    const scriptPath = path.join(process.cwd(), 'python', 'agent.py');

    // Prepare arguments for Python script
    const args = [firstName, lastName];
    if (imageBase64) {
      args.push(imageBase64);
    }

    // Check if virtual environment Python exists
    const venvPath = path.resolve(process.cwd(), 'venv', 'bin', 'python3');
    if (!fs.existsSync(venvPath)) {
      return NextResponse.json(
        {
          error: 'Python virtual environment not found. Please run: python3 -m venv venv && source venv/bin/activate && pip install -r python/requirements.txt'
        },
        { status: 500 }
      );
    }

    // Execute Python script using subprocess with virtual environment
    const result = await new Promise((resolve, reject) => {
      const pythonProcess = spawn(venvPath, [scriptPath, ...args], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PYTHONPATH: path.join(process.cwd(), 'python'),
        },
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const parsedResult = JSON.parse(stdout.trim());
            resolve(parsedResult);
          } catch (_parseError) {
            reject(new Error(`Failed to parse Python output: ${stdout}`));
          }
        } else {
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });

    // Return the result from Python script
    return NextResponse.json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: `Analysis failed: ${error.message}` },
      { status: 500 }
    );
  }
}
