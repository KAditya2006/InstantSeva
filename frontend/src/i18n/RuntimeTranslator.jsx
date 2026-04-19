import React from 'react';
import { useTranslation } from 'react-i18next';
import { translatePhrase } from './phraseTranslator';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'INPUT', 'TEXTAREA', 'SELECT']);
const ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt'];
const originalTextNodes = new WeakMap();

const shouldTranslateText = (text) => {
  const value = String(text || '').trim();
  if (!value) return false;
  if (/^[\d\s.,:/+-]+$/.test(value)) return false;
  return value.length <= 180;
};

const translateTextNode = (node, language) => {
  const original = originalTextNodes.get(node) || node.nodeValue;
  if (!shouldTranslateText(original)) return;

  originalTextNodes.set(node, original);
  node.nodeValue = translatePhrase(original, language);
};

const translateAttributes = (element, language) => {
  ATTRIBUTES.forEach((attribute) => {
    const currentValue = element.getAttribute(attribute);
    if (!shouldTranslateText(currentValue)) return;

    const dataName = `data-i18n-original-${attribute}`;
    const original = element.getAttribute(dataName) || currentValue;
    element.setAttribute(dataName, original);
    element.setAttribute(attribute, translatePhrase(original, language));
  });
};

const walkAndTranslate = (root, language) => {
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let current = walker.currentNode;

  while (current) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const element = current;
      if (SKIP_TAGS.has(element.tagName) || element.closest('[data-i18n-skip="true"]')) {
        current = walker.nextSibling();
        continue;
      }
      translateAttributes(element, language);
    }

    if (current.nodeType === Node.TEXT_NODE && !current.parentElement?.closest('[data-i18n-skip="true"]')) {
      translateTextNode(current, language);
    }

    current = walker.nextNode();
  }
};

const RuntimeTranslator = ({ children }) => {
  const { i18n } = useTranslation();

  React.useEffect(() => {
    const language = String(i18n.language || 'en').split('-')[0];
    if (!document.body) return undefined;
    if (language === 'en') {
      walkAndTranslate(document.body, language);
      return undefined;
    }

    let raf = requestAnimationFrame(() => walkAndTranslate(document.body, language));

    const observer = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => walkAndTranslate(document.body, language));
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRIBUTES
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [i18n.language]);

  return children;
};

export default RuntimeTranslator;
