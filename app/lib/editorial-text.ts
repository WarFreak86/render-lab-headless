/** Repair missing sentence separators in catalog plain text without rendering HTML. */
export function editorialText(value?: string | null) {
  return (value ?? '').replace(/([.!?])(?=[A-Z])/g, '$1 ').replace(/\s+/g, ' ').trim();
}

export function editorialTeaser(value?: string | null) {
  const text = editorialText(value);
  const sentence = text.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  if (sentence && sentence.length <= 180) return sentence;
  if (text.length <= 180) return text;
  return `${text.slice(0, 177).replace(/\s+\S*$/, '')}…`;
}
