import { describe, it, expect } from 'vitest';

interface DreamEntry {
  id: string;
  title: string;
  content: string;
  emotion: string;
  tags: string[];
  date: string;
  time: string;
}

describe('Dream data utilities', () => {
  it('should create a valid dream entry', () => {
    const dream: DreamEntry = {
      id: 'test_001',
      title: '飞翔的梦',
      content: '我在天空中自由飞翔',
      emotion: 'peace',
      tags: ['飞翔', '自由'],
      date: '2026年5月5日',
      time: '07:30',
    };

    expect(dream.id).toBe('test_001');
    expect(dream.title).toBe('飞翔的梦');
    expect(dream.emotion).toBe('peace');
    expect(dream.tags).toHaveLength(2);
    expect(dream.tags).toContain('自由');
  });

  it('should filter dreams by emotion', () => {
    const dreams: DreamEntry[] = [
      { id: '1', title: '梦1', content: '内容1', emotion: 'anxious', tags: [], date: '2026-05-01', time: '00:00' },
      { id: '2', title: '梦2', content: '内容2', emotion: 'peace', tags: [], date: '2026-05-02', time: '00:00' },
      { id: '3', title: '梦3', content: '内容3', emotion: 'fear', tags: [], date: '2026-05-03', time: '00:00' },
    ];

    const anxiousDreams = dreams.filter(d => d.emotion === 'anxious');
    expect(anxiousDreams).toHaveLength(1);
    expect(anxiousDreams[0].title).toBe('梦1');
  });

  it('should search dreams by title keyword', () => {
    const dreams: DreamEntry[] = [
      { id: '1', title: '飞翔的梦', content: '我在飞', emotion: 'peace', tags: [], date: '2026-05-01', time: '00:00' },
      { id: '2', title: '坠落的梦', content: '我在坠落', emotion: 'fear', tags: [], date: '2026-05-02', time: '00:00' },
    ];

    const q = '飞翔';
    const results = dreams.filter(d =>
      d.title.toLowerCase().includes(q.toLowerCase()) ||
      d.content.toLowerCase().includes(q.toLowerCase())
    );
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('飞翔的梦');
  });

  it('should search dreams by tag', () => {
    const dreams: DreamEntry[] = [
      { id: '1', title: '梦A', content: '内容A', emotion: 'neutral', tags: ['水', '海洋'], date: '2026-05-01', time: '00:00' },
      { id: '2', title: '梦B', content: '内容B', emotion: 'peace', tags: ['天空', '云'], date: '2026-05-02', time: '00:00' },
    ];

    const q = '海洋';
    const results = dreams.filter(d =>
      d.tags.some(t => t.toLowerCase().includes(q.toLowerCase()))
    );
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('梦A');
  });
});
