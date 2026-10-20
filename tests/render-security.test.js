import test from 'node:test';
import assert from 'node:assert/strict';
import { descriptionHtml } from '../src/security/render.js';

test('stored team descriptions cannot inject markup or break out of links',()=>{
  const html=descriptionHtml('<img src=x onerror=alert(1)>\nhttps://example.org/" onclick="alert(2)\n<script>alert(3)</script>');
  assert(!/<img|<script|<a[^>]+onclick=/i.test(html));
  assert(html.includes('&lt;img'));assert(html.includes('&quot; onclick=&quot;'));
  assert(html.includes('href="https://example.org/"'));assert(html.includes('rel="noopener noreferrer"'));
  assert(!descriptionHtml('https://alice:secret@example.org/x').includes('<a'));
  assert(!descriptionHtml('javascript:alert(1)').includes('<a'));
});
