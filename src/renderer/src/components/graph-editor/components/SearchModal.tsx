import React, { useState, useEffect, useRef } from 'react';
import { Input, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Graph } from '@antv/x6';
import { useGraphStore } from '../../../stores/useGraphStore';
import type { AnyNode } from '../../../types';

interface SearchModalProps {
  graphRef: React.MutableRefObject<Graph | null>;
}

export const SearchModal: React.FC<SearchModalProps> = ({ graphRef }) => {
  const nodes = useGraphStore(s => s.nodes);
  const setSelectedNode = useGraphStore(s => s.setSelectedNode);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AnyNode[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    const handleOpenSearch = () => {
      setSearchOpen(true);
      setSearchQuery('');
      setSearchResults(nodes);
      setSelectedResultIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    window.addEventListener('thesisflow:open-search', handleOpenSearch);
    return () => window.removeEventListener('thesisflow:open-search', handleOpenSearch);
  }, [nodes]);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = requestAnimationFrame(() => {
      const results = nodes.filter(
        node =>
          node.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.data?.remark?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      setSelectedResultIndex(0);
    });
    return () => cancelAnimationFrame(timer);
  }, [searchQuery, searchOpen, nodes]);

  const handleSelectResult = (node: AnyNode) => {
    const graph = graphRef.current;
    if (!graph) return;
    const cell = graph.getCellById(node.id);
    if (cell) {
      graph.centerCell(cell);
      setSelectedNode(node);
      setSearchOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedResultIndex(i => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedResultIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedResultIndex]) {
        handleSelectResult(searchResults[selectedResultIndex]);
      }
    }
  };

  if (!searchOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: 8,
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        padding: '12px 16px',
        minWidth: 360,
        maxWidth: 500,
      }}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-label="搜索节点"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <SearchOutlined style={{ color: '#aaa' }} />
        <Input
          ref={inputRef}
          placeholder="搜索节点 (标签/备注)..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          autoFocus
          style={{ width: 280 }}
          size="middle"
          aria-label="搜索输入框"
        />
        <span style={{ fontSize: 12, color: '#888' }}>{searchResults.length} 个结果</span>
      </div>
      <div style={{ maxHeight: 300, overflow: 'auto' }} role="listbox" aria-label="搜索结果">
        {searchResults.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#aaa' }}>
            未找到匹配的节点
          </div>
        ) : (
          searchResults.map((node, index) => (
            <div
              key={node.id}
              onClick={() => handleSelectResult(node)}
              role="option"
              aria-selected={index === selectedResultIndex}
              style={{
                padding: '8px 12px',
                borderRadius: 4,
                cursor: 'pointer',
                background: index === selectedResultIndex ? '#e6f4ff' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderBottom: index < searchResults.length - 1 ? '1px solid #f0f0f0' : 'none',
              }}
            >
              <span style={{ fontSize: 13, color: '#333', flex: 1 }}>
                {node.label || '(无标签)'}
              </span>
              {node.data?.remark && (
                <span
                  style={{
                    fontSize: 11,
                    color: '#888',
                    maxWidth: 200,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {node.data.remark}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
