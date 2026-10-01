export function parseRecord(input) {
  const fields = [];
  let field = '';
  let quoted = false;
  let closedQuote = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') { quoted = false; closedQuote = true; }
      else { field += char; }
    } else if (char === ',') {
      fields.push(field); field = ''; closedQuote = false;
    } else if (char === '"' && field === '' && !closedQuote) {
      quoted = true;
    } else if (char === '"' || closedQuote) {
      throw new SyntaxError('unexpected quote content');
    } else { field += char; }
  }
  if (quoted) throw new SyntaxError('unclosed quote');
  fields.push(field);
  return fields;
}
