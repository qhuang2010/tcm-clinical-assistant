import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const AIAnalysis = ({ data, onAnalyze }) => {
  const [loading, setLoading] = useState(false);

  const handleAnalyzeClick = async () => {
    setLoading(true);
    try {
      await onAnalyze();
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-analysis-section">
      <div className="section-title">
        <span>🤖 AI 智能评价</span>
        <button
          className="btn-analyze"
          onClick={handleAnalyzeClick}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              <span>分析中...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>生成评价</span>
            </>
          )}
        </button>
      </div>

      <div className="analysis-content">
        {!data ? (
          <div className="analysis-empty">
            <div className="analysis-empty-icon">📝</div>
            <p>点击"生成评价"以获取AI对当前病历的客观分析</p>
          </div>
        ) : (
          <div className="analysis-result">
            {data.report ? (
              <div className="analysis-report markdown-body">
                <ReactMarkdown>{data.report}</ReactMarkdown>
              </div>
            ) : (
              <>
                <div className="analysis-item">
                  <h4>脉象与主诉一致性评价</h4>
                  <p>{data.consistency_comment || '暂无评价'}</p>
                </div>
                <div className="analysis-item">
                  <h4>用药合理性分析</h4>
                  <p>{data.prescription_comment || '暂无评价'}</p>
                </div>
                <div className="analysis-item">
                  <h4>综合建议</h4>
                  <p>{data.suggestion || '暂无建议'}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysis;
