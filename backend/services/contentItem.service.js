const ContentItem = require('../models/ContentItem');
const campaignNumberService = require('./campaignNumber.service');
const contentCalendarService = require('./contentCalendar.service');

async function createContentItem(payload, user) {
  const contentItem = await ContentItem.create({
    ...payload,
    contentNumber: payload.contentNumber || await campaignNumberService.generateContentNumber(payload.workspace),
    publishDateTime: payload.publishDateTime || contentCalendarService.buildPublishDateTime(payload.scheduledDate, payload.scheduledTime),
    contentOwner: payload.contentOwner || user?._id,
    createdBy: payload.createdBy || user?._id
  });
  await contentCalendarService.createCalendarEvent(contentItem);
  return contentItem;
}

module.exports = { createContentItem };
