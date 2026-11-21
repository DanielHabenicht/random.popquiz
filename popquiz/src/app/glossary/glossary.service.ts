import { Injectable } from '@angular/core';
import { GlossaryEntry, glossary } from './glossary-data';

export interface TextSegment {
  text: string;
  entry?: GlossaryEntry;
}

const LETTER = 'A-Za-zÄÖÜäöüß';
/** German inflection endings that may follow a term ("Fahrwassers", "Tonnen"). */
const ENDINGS = '(?:s|es|n|en|e|er|ern)?';

@Injectable({ providedIn: 'root' })
export class GlossaryService {
  private readonly regex: RegExp;
  private readonly lookup = new Map<string, GlossaryEntry>();
  private readonly cache = new Map<string, TextSegment[]>();

  constructor() {
    const forms: string[] = [];
    for (const entry of glossary) {
      for (const form of [entry.term, ...(entry.forms || [])]) {
        this.lookup.set(form.toLowerCase(), entry);
        forms.push(form);
      }
    }
    // longest first, so "Fahrt durchs Wasser" wins over "Fahrt"
    forms.sort((a, b) => b.length - a.length);
    const pattern = forms.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')).join('|');
    // no lookbehind (not supported by older Safari): the preceding character is captured instead
    this.regex = new RegExp(`(^|[^${LETTER}])((${pattern})${ENDINGS})(?![${LETTER}])`, 'gi');
  }

  /** Splits a text into plain parts and glossary terms. */
  public segments(text: string): TextSegment[] {
    if (!text) {
      return [];
    }
    const cached = this.cache.get(text);
    if (cached) {
      return cached;
    }
    const result: TextSegment[] = [];
    let last = 0;
    this.regex.lastIndex = 0;
    let match: RegExpExecArray;
    while ((match = this.regex.exec(text))) {
      const [, before, word, base] = match;
      const start = match.index + before.length;
      // the next match may start right after this word (the separating character was consumed)
      this.regex.lastIndex = start + word.length;
      const entry = this.lookup.get(base.replace(/\s+/g, ' ').toLowerCase());
      if (!entry || (entry.caseSensitive && ![entry.term, ...(entry.forms || [])].includes(base))) {
        continue;
      }
      if (start > last) {
        result.push({ text: text.slice(last, start) });
      }
      result.push({ text: word, entry });
      last = start + word.length;
    }
    if (last < text.length) {
      result.push({ text: text.slice(last) });
    }
    this.cache.set(text, result);
    return result;
  }
}
