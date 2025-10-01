if (typeof window !== 'undefined' && !window.path) {
  window.path = {
    extname: function(path) {
      const match = /\.[^/.]+$/.exec(path);
      return match ? match[0] : '';
    },
    basename: function(path, ext) {
      const base = path.split('/').pop() || '';
      return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base;
    }
  };
}

if (typeof window !== 'undefined' && !window.buffer) {
  window.buffer = {
    Blob: window.Blob || null,
    Buffer: class Buffer extends Uint8Array {
      constructor(data) {
        if (typeof data === 'string') {
          const encoder = new TextEncoder();
          super(encoder.encode(data));
        } else if (Array.isArray(data)) {
          super(data);
        } else {
          super(data);
        }
      }
      toString() {
        const decoder = new TextDecoder();
        return decoder.decode(this);
      }
    }
  };
}

if (typeof global === 'undefined' && typeof window !== 'undefined') {
  window.global = window;
}