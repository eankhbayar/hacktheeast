import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES } from '../config/dynamodb';
import type { NotificationLog, NotificationType } from '../types';

/**
 * Logs a notification record and (in the future) sends a push
 * notification via FCM/APNs. Currently only persists the log entry.
 */
export async function sendPushToParent(
  parentId: string,
  childId: string,
  type: NotificationType,
  title: string,
  body: string
): Promise<NotificationLog> {
  const notification: NotificationLog = {
    notificationId: uuidv4(),
    parentId,
    childId,
    type,
    title,
    body,
    sentAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({ TableName: TABLES.NOTIFICATIONS, Item: notification })
  );

  // TODO: Integrate with FCM/APNs to actually deliver the push notification
  console.log(`[notification] ${type} -> parent ${parentId}: ${title}`);

  return notification;
}

export async function notifyChildLocked(
  parentId: string,
  childId: string,
  sessionId: string
): Promise<NotificationLog> {
  return sendPushToParent(
    parentId,
    childId,
    'child_locked',
    'Device Locked',
    `Your child's device has been locked after 3 incorrect answers (session ${sessionId}). Open AllNighters to unlock.`
  );
}

export async function getNotifications(parentId: string): Promise<NotificationLog[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLES.NOTIFICATIONS,
      IndexName: 'parentId-index',
      KeyConditionExpression: 'parentId = :pid',
      ExpressionAttributeValues: { ':pid': parentId },
    })
  );
  return (result.Items as NotificationLog[]) || [];
}
