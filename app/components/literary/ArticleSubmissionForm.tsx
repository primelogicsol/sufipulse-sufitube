"use client";
import { useState } from 'react';
// import { supabase } from '../../lib/supabase';
import { Check, X, Loader } from 'lucide-react';
import DOMPurify from "dompurify";

export function ArticleSubmissionForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    category: 'reflective_essay',
    content: '',
    excerpt: '',
    reading_time_minutes: 5,
    tags: ''
  });



  if (submitted) {
    return (
      <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Article Submitted</h3>
        <p className="text-neutral-300">
          Your article has been submitted for editorial review. You will be notified of the review status.
        </p>
      </div>
    );
  }

  return (
    <form className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Title *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: DOMPurify.sanitize(e.target.value) })}
          className="form-input w-full px-4 py-2.5 bg-neutral-900/50 rounded-lg text-white"
          placeholder="Enter article title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Subtitle (optional)
        </label>
        <input
          type="text"
          value={formData.subtitle}
          onChange={(e) => setFormData({ ...formData, subtitle: DOMPurify.sanitize(e.target.value) })}
          className="form-input w-full px-4 py-2.5 bg-neutral-900/50 rounded-lg text-white"
          placeholder="Enter subtitle"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="form-input w-full px-4 py-2.5 bg-neutral-900/50 rounded-lg text-white"
          >
            <option value="reflective_essay">Reflective Essay</option>
            <option value="spiritual_commentary">Spiritual Commentary</option>
            <option value="sufi_philosophy">Sufi Philosophy</option>
            <option value="contemporary_discourse">Contemporary Discourse</option>
            <option value="thematic_analysis">Thematic Analysis</option>
            <option value="institutional_guidance">Institutional Guidance</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Estimated Reading Time (minutes) *
          </label>
          <input
            type="number"
            required
            min="1"
            max="120"
            value={formData.reading_time_minutes}
            onChange={(e) => setFormData({ ...formData, reading_time_minutes: parseInt(e.target.value) })}
            className="form-input w-full px-4 py-2.5 bg-neutral-900/50 rounded-lg text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Excerpt (Short Summary) *
        </label>
        <textarea
          required
          rows={3}
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: DOMPurify.sanitize(e.target.value) })}
          className="form-input w-full px-4 py-2.5 bg-neutral-900/50 rounded-lg text-white"
          placeholder="Brief summary of the article (2-3 sentences)"
        />
        <p className="text-xs text-neutral-500 mt-1">
          This will be displayed in article previews
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Article Content *
        </label>
        <textarea
          required
          rows={16}
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: DOMPurify.sanitize(e.target.value) })}
          className="form-input w-full px-4 py-2.5 bg-neutral-900/50 rounded-lg text-white font-mono text-sm"
          placeholder="Write your article here..."
        />
        <p className="text-xs text-neutral-500 mt-1">
          You can use plain text. Paragraphs will be preserved.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Tags (comma separated)
        </label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: DOMPurify.sanitize(e.target.value) })}
          className="form-input w-full px-4 py-2.5 bg-neutral-900/50 rounded-lg text-white"
          placeholder="sufism, spirituality, philosophy"
        />
        <p className="text-xs text-neutral-500 mt-1">
          Add relevant keywords to help readers discover your article
        </p>
      </div>

      <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-lg p-4">
        <p className="text-neutral-300 text-sm leading-relaxed">
          By submitting this article, you agree to editorial review and acknowledge that publication is subject to approval by the Editorial Council.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 flex items-center justify-center gap-2 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 rounded-lg px-6 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Submit for Review
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => setFormData({
            title: '',
            subtitle: '',
            category: 'reflective_essay',
            content: '',
            excerpt: '',
            reading_time_minutes: 5,
            tags: ''
          })}
          className="px-6 py-3 bg-neutral-900/50 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg font-medium transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
