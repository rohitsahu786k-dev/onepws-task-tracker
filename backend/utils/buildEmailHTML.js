const buildEmailHTML = ({ title = 'OnePWS', body = '', actionText, actionUrl } = {}) => `
<!doctype html>
<html><body style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
  <h1 style="font-size:20px">${title}</h1>
  <div>${body}</div>
  ${actionText && actionUrl ? `<p><a href="${actionUrl}" style="background:#111827;color:#fff;padding:10px 14px;text-decoration:none;border-radius:6px">${actionText}</a></p>` : ''}
</body></html>`;

module.exports = buildEmailHTML;
