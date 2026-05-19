const WikiTemplate = require('../models/WikiTemplate');

const DEFAULT_WIKI_TEMPLATES = [
  {
    name: 'SOP Template',
    articleType: 'sop',
    defaultTitle: 'New SOP',
    defaultSections: [
      { title: 'Purpose', placeholder: 'Explain why this SOP exists.', required: true, order: 1 },
      { title: 'Scope', placeholder: 'Define teams and situations covered.', required: true, order: 2 },
      { title: 'Step-by-Step Process', placeholder: 'List the process clearly.', required: true, order: 3 },
      { title: 'Approval Matrix', placeholder: 'Add approval rules.', required: false, order: 4 },
    ],
    tags: ['sop'],
    isDefault: true,
  },
  {
    name: 'FAQ Template',
    articleType: 'faq',
    defaultTitle: 'New FAQ',
    defaultSections: [
      { title: 'Question', placeholder: 'Add the question.', required: true, order: 1 },
      { title: 'Answer', placeholder: 'Add the answer.', required: true, order: 2 },
      { title: 'Related Articles', placeholder: 'Link related docs.', required: false, order: 3 },
    ],
    tags: ['faq'],
    isDefault: true,
  },
  {
    name: 'Checklist Template',
    articleType: 'checklist',
    defaultTitle: 'New Checklist',
    defaultSections: [
      { title: 'Objective', placeholder: 'Define checklist objective.', required: true, order: 1 },
      { title: 'Checklist Items', placeholder: 'Add checklist items.', required: true, order: 2 },
      { title: 'Owner', placeholder: 'Add owner or role.', required: false, order: 3 },
    ],
    tags: ['checklist'],
    isDefault: true,
  },
  { name: 'Policy Template', articleType: 'policy', defaultTitle: 'New Policy', tags: ['policy'], isDefault: true },
  { name: 'Training Guide Template', articleType: 'training', defaultTitle: 'New Training Guide', tags: ['training'], isDefault: true },
  { name: 'Troubleshooting Template', articleType: 'troubleshooting', defaultTitle: 'Troubleshooting Guide', tags: ['troubleshooting'], isDefault: true },
  { name: 'Brand Guideline Template', articleType: 'brand_guideline', defaultTitle: 'Brand Guideline', tags: ['brand'], isDefault: true },
  { name: 'Process Guide Template', articleType: 'process', defaultTitle: 'Process Guide', tags: ['process'], isDefault: true },
];

async function seedDefaultWikiTemplates(workspace, user) {
  const existing = await WikiTemplate.countDocuments({ workspace, isDefault: true });
  if (existing) return [];
  return WikiTemplate.insertMany(DEFAULT_WIKI_TEMPLATES.map((item) => ({ ...item, workspace, createdBy: user })));
}

module.exports = { DEFAULT_WIKI_TEMPLATES, seedDefaultWikiTemplates };
