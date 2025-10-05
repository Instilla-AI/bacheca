// components/BigQueryChat.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Database, Settings, Loader2 } from 'lucide-react';

interface Dataset {
  project_id: string;
  dataset_id: string;
  table_count: number;
  location?: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sql?: string;
  data?: any[];
  row_count?: number;
  model_used?: string;
  timestamp: string;
}

interface ModelConfig {
  provider: 'claude' | 'openai' | 'gemini';
  model_name: string;
  api_key: string;
}

export default function BigQueryChat() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    provider: 'claude',
    model_name: 'claude-3-5-sonnet-20241022',
    api_key: '',
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch datasets on mount
  useEffect(() => {
    fetchDatasets();
  }, []);
  
  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const fetchDatasets = async () => {
    try {
      const response = await fetch('/api/bigquery/datasets');
      const data = await response.json();
      setDatasets(data.datasets || []);
      
      // Add system message
      setMessages([{
        role: 'system',
        content: `Found ${data.datasets?.length || 0} datasets. Please select one to start querying.`,
        timestamp: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('Error fetching datasets:', error);
      setMessages([{
        role: 'system',
        content: 'Error loading datasets. Please refresh the page.',
        timestamp: new Date().toISOString(),
      }]);
    }
  };
  
  const handleDatasetSelect = (datasetId: string, projectId: string) => {
    setSelectedDataset(datasetId);
    setSelectedProject(projectId);
    
    setMessages(prev => [...prev, {
      role: 'system',
      content: `Selected dataset: ${datasetId}. You can now ask questions about your data!`,
      timestamp: new Date().toISOString(),
    }]);
  };
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedDataset) return;
    
    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: inputMessage,
          dataset_id: selectedDataset,
          project_id: selectedProject,
          model_provider: modelConfig.provider,
          model_name: modelConfig.model_name,
          api_key: modelConfig.api_key || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          sql: data.sql,
          data: data.data,
          row_count: data.row_count,
          model_used: data.model_used,
          timestamp: data.timestamp,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${data.error}`,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveModelConfig = async () => {
    try {
      const response = await fetch('/api/model/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelConfig),
      });
      
      if (response.ok) {
        alert('Model configuration saved successfully!');
        setShowSettings(false);
      } else {
        alert('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error saving configuration');
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Dataset Selection */}
      <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Datasets</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3 text-gray-900">Model Settings</h3>
            
            <label className="block mb-3">
              <span className="text-sm text-gray-700">Provider</span>
              <select
                value={modelConfig.provider}
                onChange={(e) => setModelConfig({
                  ...modelConfig,
                  provider: e.target.value as any,
                  model_name: e.target.value === 'claude' 
                    ? 'claude-3-5-sonnet-20241022'
                    : e.target.value === 'openai'
                    ? 'gpt-4'
                    : 'gemini-pro'
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="claude">Claude (Anthropic)</option>
                <option value="openai">OpenAI GPT</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </label>
            
            <label className="block mb-3">
              <span className="text-sm text-gray-700">Model Name</span>
              <input
                type="text"
                value={modelConfig.model_name}
                onChange={(e) => setModelConfig({
                  ...modelConfig,
                  model_name: e.target.value
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., gpt-4"
              />
            </label>
            
            <label className="block mb-3">
              <span className="text-sm text-gray-700">API Key (optional)</span>
              <input
                type="password"
                value={modelConfig.api_key}
                onChange={(e) => setModelConfig({
                  ...modelConfig,
                  api_key: e.target.value
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Your API key"
              />
            </label>
            
            <button
              onClick={handleSaveModelConfig}
              className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        )}
        
        {/* Datasets List */}
        <div className="space-y-2">
          {datasets.map((dataset) => (
            <button
              key={`${dataset.project_id}.${dataset.dataset_id}`}
              onClick={() => handleDatasetSelect(dataset.dataset_id, dataset.project_id)}
              className={`w-full text-left p-4 rounded-lg transition-colors ${
                selectedDataset === dataset.dataset_id
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              <div className="flex items-start">
                <Database className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {dataset.dataset_id}
                  </p>
                  <p className="text-sm text-gray-500">
                    {dataset.table_count} tables
                  </p>
                  {dataset.location && (
                    <p className="text-xs text-gray-400 mt-1">
                      {dataset.location}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            BigQuery Chat Assistant
          </h1>
          {selectedDataset && (
            <p className="text-sm text-gray-600 mt-1">
              Querying: <span className="font-medium">{selectedDataset}</span>
            </p>
          )}
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-3xl rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.role === 'system'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {/* SQL Query */}
                {message.sql && (
                  <div className="mt-3 p-3 bg-gray-900 rounded text-sm text-gray-100 overflow-x-auto">
                    <code>{message.sql}</code>
                  </div>
                )}
                
                {/* Data Table */}
                {message.data && message.data.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          {Object.keys(message.data[0]).map((key) => (
                            <th
                              key={key}
                              className="px-4 py-2 text-left font-medium text-gray-700"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {message.data.slice(0, 10).map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).map((value: any, j) => (
                              <td key={j} className="px-4 py-2 text-gray-900">
                                {value?.toString() || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {message.data.length > 10 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Showing 10 of {message.row_count} rows
                      </p>
                    )}
                  </div>
                )}
                
                {/* Metadata */}
                {message.model_used && (
                  <p className="text-xs text-gray-400 mt-2">
                    Model: {message.model_used}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                selectedDataset
                  ? "Ask a question about your data..."
                  : "Select a dataset first..."
              }
              disabled={!selectedDataset || isLoading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={!selectedDataset || isLoading || !inputMessage.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
