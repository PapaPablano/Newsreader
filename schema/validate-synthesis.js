/**
 * Shared JSON Schema Contract Validator for News Synthesis
 * Used by scheduled producer (scripts/refresh-beats.js), live search producer (server/worker), and frontend renderer.
 */

export function validateSynthesis(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Input must be a valid JSON object'] };
  }

  if (!data.headline || typeof data.headline !== 'string') {
    errors.push('Missing or invalid string: headline');
  }

  if (!data.summary_intro || typeof data.summary_intro !== 'string') {
    errors.push('Missing or invalid string: summary_intro');
  }

  if (!Array.isArray(data.sources) || data.sources.length === 0) {
    errors.push('sources must be a non-empty array');
  } else {
    data.sources.forEach((src, idx) => {
      if (!src.id || !src.outlet || !src.title || !src.url) {
        errors.push(`Source at index ${idx} missing required fields (id, outlet, title, url)`);
      }
    });
  }

  if (!Array.isArray(data.consensus)) {
    errors.push('consensus must be an array');
  }

  if (!Array.isArray(data.disagreements)) {
    errors.push('disagreements must be an array');
  } else {
    data.disagreements.forEach((item, idx) => {
      if (!item.topic || !item.stance_a || !item.stance_b) {
        errors.push(`Disagreement item at index ${idx} missing required fields (topic, stance_a, stance_b)`);
      }
    });
  }

  if (!Array.isArray(data.sections) || data.sections.length === 0) {
    errors.push('sections must be a non-empty array');
  } else {
    data.sections.forEach((sec, sIdx) => {
      if (!sec.title || !Array.isArray(sec.sentences)) {
        errors.push(`Section at index ${sIdx} missing title or sentences array`);
      } else {
        sec.sentences.forEach((sent, sentIdx) => {
          if (!sent.text || !Array.isArray(sent.citations)) {
            errors.push(`Sentence at section ${sIdx}, index ${sentIdx} missing text or citations array`);
          }
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
