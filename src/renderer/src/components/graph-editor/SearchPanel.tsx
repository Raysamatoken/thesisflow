import React, { useEffect, useState } from 'react';
import { Input, Button } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import type { AnyNode } from '../../types';
import { useGraphStore } from '../../stores/useGraphStore';
import { useGraphContext } from '../../contexts/GraphContext';

const SearchPanel: React.FC = () => {
  const graph = useGraphContext();
  const nodes = useGraphStore(s => s.nodes);
  const setSelectedNode = useGraphStore(s => s.setSelectedNode);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnyNode[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setQuery('');
      setResults(nodes);
      setSelectedIndex(0);
    };
    window.addEventListener('thesisflow:open-search', handleOpen);
    return () => window.removeEventListener('thesisflow:open-search', handleOpen);
  }, [nodes]);

  useEffect(() => {
    if (!open) return;
    const timer = requestAnimationFrame(() => {
      const filtered = nodes.filter(
        node =>
          node.label?.toLowerCase().includes(query.toLowerCase()) ||
          node.data?.remark?.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setSelectedIndex(0);
    });
    return () => cancelAnimationFrame(timer);
  }, [query, open, nodes]);

  const handleSelect = (node: AnyNode) => {
    if (!graph) return;
    const cell = graph.getCellById(node.id);
    if (cell) {
      graph.centerCell(cell);
      setSelectedNode(node);
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  if (!open) return null;

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
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <SearchOutlined style={{ color: '#aaa' }} />
        <Input
          placeholder="搜索节点 (标签/备注)..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
          style={{ width: 280 }}
          size="middle"
        />
        <span style={{ fontSize: 12, color: '#888' }}>{results.length} 个结果</span>
        <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setOpen(false)} />
      </div>
      <div style={{ maxHeight: 300, overflow: 'auto' }}>
        {results.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#aaa' }}>
            未找到匹配的节点
          </div>
        ) : (
          results.map((node, index) => (
            <div
              key={node.id}
              onClick={() => handleSelect(node)}
              style={{
                padding: '8px 12px',
                borderRadius: 4,
                cursor: 'pointer',
                background: index === selectedIndex ? '#e6f4ff' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderBottom: index < results.length - 1 ? '1px solid #f0f0f0' : 'none',
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

export default SearchPanel;
