module.exports = (req, res) => {
  if (req.method === 'POST') {
    let base64 = (req.body && req.body.base64) || '';
    let filename = (req.body && req.body.filename) || 'CRM_leads.xlsx';
    let mimeType = (req.body && req.body.mimeType) || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if (!base64 && typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        base64 = parsed.base64 || '';
        filename = parsed.filename || filename;
        mimeType = parsed.mimeType || mimeType;
      } catch (e) {}
    }

    const buffer = Buffer.from(base64, 'base64');

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-Length', buffer.length);
    return res.status(200).send(buffer);
  }

  return res.status(405).send('Method Not Allowed');
};
