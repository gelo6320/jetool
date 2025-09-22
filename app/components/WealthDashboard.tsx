// components/WealthDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Camera, Upload } from 'lucide-react';

interface JewishIdentityAnalysis {
  persona: string;
  probabilita_percentuale: number;
  categoria: string;
  spiegazione: string;
  confidenza: number;
  indicatori_principali: string[];
  analisi_immagine?: {
    punteggio_immagine: number;
    indicatori_visivi: string[];
  };
}

interface AnalyzeRequest {
  firstName: string;
  lastName: string;
  imageBase64?: string;
}

const WealthDashboard: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<JewishIdentityAnalysis | null>(null);

  // Cleanup URL objects on unmount
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelect = (file: File) => {
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert('File is too large. Maximum size: 10MB');
      return;
    }

    setSelectedFile(file);
    // Convert file to URL for compatibility
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleFileSelect(file);
      } else {
        alert('Please select only image files');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleAnalyze = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert('Please enter first name and last name');
      return;
    }

    setIsAnalyzing(true);
    setResults(null);

    try {
      // Prepare request data
      const requestData: AnalyzeRequest = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };

      // Convert image to base64 if selected
      if (selectedFile) {
        try {
          const base64 = await fileToBase64(selectedFile);
          requestData.imageBase64 = base64;
        } catch (_error) {
          alert('Failed to process image. Please try again.');
          setIsAnalyzing(false);
          return;
        }
      }

      // Call the API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();

      // Check if there's an error in the response
      if (data.error) {
        throw new Error(data.error);
      }

      // Transform the API response to match the expected format
      const transformedResult: JewishIdentityAnalysis = {
        persona: data.persona,
        probabilita_percentuale: data.risultato_finale?.probabilita_percentuale || 0,
        categoria: data.risultato_finale?.categoria || 'unknown',
        spiegazione: data.risultato_finale?.spiegazione || 'No explanation available',
        confidenza: data.risultato_finale?.confidenza || 0,
        indicatori_principali: data.risultato_finale?.indicatori_principali || [],
        analisi_immagine: data.analisi_immagine ? {
          punteggio_immagine: data.analisi_immagine.punteggio_immagine || 0,
          indicatori_visivi: data.analisi_immagine.indicatori_visivi || []
        } : undefined
      };

      setResults(transformedResult);

    } catch (error) {
      console.error('Analysis error:', error);
      alert(`Analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCategoryColor = (categoria: string): string => {
    switch (categoria.toLowerCase()) {
      case 'molto_bassa': return '#EF4444';
      case 'bassa': return '#F59E0B';
      case 'moderata': return '#FCD34D';
      case 'alta': return '#10B981';
      case 'molto_alta': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getCategoryLabel = (categoria: string): string => {
    switch (categoria.toLowerCase()) {
      case 'molto_bassa': return 'Very Low Probability';
      case 'bassa': return 'Low Probability';
      case 'moderata': return 'Moderate Probability';
      case 'alta': return 'High Probability';
      case 'molto_alta': return 'Very High Probability';
      default: return 'Unknown';
    }
  };

  return (
    <div className="wealth-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Jew Detector</h1>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Input Form */}
        <div className="analysis-form">
          <h2>
            Analyze Jewish Identity
          </h2>
          
          <div className="form-grid">
            <div className="input-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                placeholder="e.g. Elon"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                placeholder="e.g. Musk"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label>
              <Camera size={16} />
              Image (optional)
            </label>
            <div
              className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              {selectedFile ? (
                <div className="file-preview">
                  <img src={imageUrl} alt="Preview" className="preview-image" />
                  <p>{selectedFile.name}</p>
                  <button
                    type="button"
                    className="remove-file"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setImageUrl('');
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="drop-zone-content">
                  <Upload size={32} />
                  <p>Drag an image here or click to select</p>
                  <span className="file-types">PNG, JPG, JPEG up to 10MB</span>
                </div>
              )}
            </div>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
          </div>

          <button 
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <div className="loading-spinner" />
            ) : (
              <Search size={20} />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
          </button>
        </div>

        {/* Side Image */}
        <div className="side-image-container">
          <Image
            src="/assets/j.jpg"
            alt="Side image"
            className="side-image"
            width={400}
            height={300}
          />
        </div>

        {/* Results */}
        {results && (
          <div className="results-container">
            <div className="results-header">
              <h2>
                Analysis Results: {results.persona}
              </h2>
            </div>

            {/* Score Display */}
            <div className="score-section">
              <div className="score-main">
                <div className="score-number">
                  {results.probabilita_percentuale}
                  <span>%</span>
                </div>
                <div className="score-category" style={{ color: getCategoryColor(results.categoria) }}>
                  {getCategoryLabel(results.categoria)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-container">
                <div className="progress-label">
                  <span>Jewish Identity Probability</span>
                  <span>{results.probabilita_percentuale}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${results.probabilita_percentuale}%`,
                      backgroundColor: getCategoryColor(results.categoria)
                    }}
                  />
                </div>
              </div>

              <div className="confidence-badge">
                Confidence: {Math.round(results.confidenza * 100)}%
              </div>
            </div>

            {/* Analysis Details */}
            <div className="details-grid">
              <div className="detail-card">
                <h3>Explanation</h3>
                <p>{results.spiegazione}</p>
              </div>
              {results.indicatori_principali && results.indicatori_principali.length > 0 && (
                <div className="detail-card">
                  <h3>Key Indicators</h3>
                  <ul className="factors-list">
                    {results.indicatori_principali.map((indicator, index) => (
                      <li key={index}>{indicator}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* How it Works Section */}
        <section className="how-it-works">
          <div className="how-it-works-container">
            <h2>How It Works</h2>

            <div className="how-it-works-content">
              <div className="how-it-works-text">
                <p>
                  The Jew Detector represents a groundbreaking paradigm in artificial intelligence, being the world's first
                  AI system specifically engineered for Jewish identity recognition. This revolutionary technology has been
                  meticulously trained on vast, comprehensive databases curated by leading ethnological researcher Aaron Hill,
                  utilizing the most sophisticated machine learning algorithms and Retrieval-Augmented Generation (RAG) methodologies.
                </p>

                <p>
                  Through an unprecedented fusion of advanced neural network architectures, deep learning paradigms, and
                  cutting-edge natural language processing techniques, our system achieves unparalleled accuracy in identifying
                  Jewish heritage indicators. The proprietary training process incorporates multi-modal data analysis,
                  encompassing linguistic patterns, historical migration trajectories, genetic predisposition markers,
                  and cultural semiotics derived from millennia of Jewish diaspora experiences.
                </p>

                <p>
                  Employing state-of-the-art transformer architectures enhanced with domain-specific fine-tuning,
                  the Jew Detector processes complex probabilistic models that transcend traditional binary classification,
                  delivering nuanced confidence metrics that reflect the intricate tapestry of Jewish identity formation
                  across diverse geographical and temporal contexts.
                </p>
              </div>

              <div className="how-it-works-image">
                <Image
                  src="/assets/in the media.jpeg"
                  alt="Jew Detector in the Media"
                  className="media-image"
                  width={600}
                  height={400}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default WealthDashboard;