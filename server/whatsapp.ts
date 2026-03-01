import axios from "axios";
import { db } from "./db";
import { whatsappMessages, whatsappTemplates, customers } from "../shared/schema";
import { eq } from "drizzle-orm";

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

function getHeaders() {
  return {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function formatPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (!cleaned.startsWith("91") && cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }
  return cleaned;
}

function isConfigured(): boolean {
  return !!(PHONE_NUMBER_ID && ACCESS_TOKEN);
}

export async function sendTextMessage(
  phoneNumber: string,
  messageText: string,
  customerId?: number,
  templateId?: number
) {
  const formattedPhone = formatPhone(phoneNumber);

  const msgRecord = await db
    .insert(whatsappMessages)
    .values({
      customerId: customerId || null,
      phoneNumber: formattedPhone,
      templateId: templateId || null,
      message: messageText,
      status: "PENDING",
    })
    .returning();

  if (!isConfigured()) {
    await db
      .update(whatsappMessages)
      .set({
        status: "FAILED",
        errorMessage: "WhatsApp API not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.",
      })
      .where(eq(whatsappMessages.id, msgRecord[0].id));
    return { success: false, error: "WhatsApp API not configured", dbId: msgRecord[0].id };
  }

  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "text",
        text: { body: messageText },
      },
      { headers: getHeaders() }
    );

    const metaMessageId = response.data?.messages?.[0]?.id;

    await db
      .update(whatsappMessages)
      .set({
        status: "SENT",
        messageId: metaMessageId,
        sentAt: new Date(),
      })
      .where(eq(whatsappMessages.id, msgRecord[0].id));

    return { success: true, messageId: metaMessageId, dbId: msgRecord[0].id };
  } catch (error: any) {
    const errorMsg =
      error.response?.data?.error?.message || error.message || "Unknown error";

    await db
      .update(whatsappMessages)
      .set({
        status: "FAILED",
        errorMessage: errorMsg,
      })
      .where(eq(whatsappMessages.id, msgRecord[0].id));

    return { success: false, error: errorMsg, dbId: msgRecord[0].id };
  }
}

export async function sendTemplateMessage(
  phoneNumber: string,
  templateName: string,
  languageCode: string,
  components: any[],
  customerId?: number
) {
  const formattedPhone = formatPhone(phoneNumber);

  const template = await db.query.whatsappTemplates.findFirst({
    where: eq(whatsappTemplates.templateName, templateName),
  });

  const msgRecord = await db
    .insert(whatsappMessages)
    .values({
      customerId: customerId || null,
      phoneNumber: formattedPhone,
      templateId: template?.id || null,
      message: `[Template: ${templateName}]`,
      status: "PENDING",
    })
    .returning();

  if (!isConfigured()) {
    await db
      .update(whatsappMessages)
      .set({
        status: "FAILED",
        errorMessage: "WhatsApp API not configured",
      })
      .where(eq(whatsappMessages.id, msgRecord[0].id));
    return { success: false, error: "WhatsApp API not configured", dbId: msgRecord[0].id };
  }

  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      },
      { headers: getHeaders() }
    );

    const metaMessageId = response.data?.messages?.[0]?.id;

    await db
      .update(whatsappMessages)
      .set({
        status: "SENT",
        messageId: metaMessageId,
        sentAt: new Date(),
      })
      .where(eq(whatsappMessages.id, msgRecord[0].id));

    return { success: true, messageId: metaMessageId, dbId: msgRecord[0].id };
  } catch (error: any) {
    const errorMsg =
      error.response?.data?.error?.message || error.message || "Unknown error";

    await db
      .update(whatsappMessages)
      .set({
        status: "FAILED",
        errorMessage: errorMsg,
      })
      .where(eq(whatsappMessages.id, msgRecord[0].id));

    return { success: false, error: errorMsg, dbId: msgRecord[0].id };
  }
}

export async function sendDocumentMessage(
  phoneNumber: string,
  documentUrl: string,
  filename: string,
  caption: string,
  customerId?: number
) {
  const formattedPhone = formatPhone(phoneNumber);

  const msgRecord = await db
    .insert(whatsappMessages)
    .values({
      customerId: customerId || null,
      phoneNumber: formattedPhone,
      message: `[Document: ${filename}] ${caption}`,
      status: "PENDING",
    })
    .returning();

  if (!isConfigured()) {
    await db
      .update(whatsappMessages)
      .set({
        status: "FAILED",
        errorMessage: "WhatsApp API not configured",
      })
      .where(eq(whatsappMessages.id, msgRecord[0].id));
    return { success: false, error: "WhatsApp API not configured", dbId: msgRecord[0].id };
  }

  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "document",
        document: {
          link: documentUrl,
          filename,
          caption,
        },
      },
      { headers: getHeaders() }
    );

    const metaMessageId = response.data?.messages?.[0]?.id;

    await db
      .update(whatsappMessages)
      .set({
        status: "SENT",
        messageId: metaMessageId,
        sentAt: new Date(),
      })
      .where(eq(whatsappMessages.id, msgRecord[0].id));

    return { success: true, messageId: metaMessageId, dbId: msgRecord[0].id };
  } catch (error: any) {
    const errorMsg =
      error.response?.data?.error?.message || error.message || "Unknown error";

    await db
      .update(whatsappMessages)
      .set({
        status: "FAILED",
        errorMessage: errorMsg,
      })
      .where(eq(whatsappMessages.id, msgRecord[0].id));

    return { success: false, error: errorMsg, dbId: msgRecord[0].id };
  }
}

export async function sendInvoice(
  phoneNumber: string,
  invoiceNumber: string,
  totalAmount: string,
  pdfUrl: string,
  customerId?: number
) {
  return sendDocumentMessage(
    phoneNumber,
    pdfUrl,
    `Invoice_${invoiceNumber}.pdf`,
    `Your invoice ${invoiceNumber} for ₹${totalAmount}. Thank you for shopping with Suvidha Pharmacy!`,
    customerId
  );
}

export async function sendOrderUpdate(
  phoneNumber: string,
  orderNumber: string,
  status: string,
  customerId?: number
) {
  const statusMessages: Record<string, string> = {
    CONFIRMED: `Your order ${orderNumber} has been confirmed and is being prepared. We will notify you when it's dispatched.`,
    DISPATCHED: `Your order ${orderNumber} has been dispatched and is on the way! Expected delivery within 2-4 hours.`,
    DELIVERED: `Your order ${orderNumber} has been delivered. Thank you for choosing Suvidha Pharmacy!`,
    CANCELLED: `Your order ${orderNumber} has been cancelled. If you have any questions, please contact our support.`,
  };

  const message =
    statusMessages[status] ||
    `Your order ${orderNumber} status has been updated to: ${status}`;

  return sendTextMessage(phoneNumber, message, customerId);
}

export async function sendLoyaltyNotification(
  phoneNumber: string,
  customerName: string,
  pointsEarned: number,
  totalPoints: number,
  tier: string,
  customerId?: number
) {
  const message = `Hi ${customerName}! You've earned ${pointsEarned} loyalty points. Your total: ${totalPoints} points (${tier} tier). Keep shopping to unlock more rewards at Suvidha Pharmacy!`;
  return sendTextMessage(phoneNumber, message, customerId);
}

export async function sendExpiryReminder(
  phoneNumber: string,
  customerName: string,
  medicineName: string,
  refillDate: string,
  customerId?: number
) {
  const message = `Hi ${customerName}, this is a reminder from Suvidha Pharmacy. Your medicine "${medicineName}" may need a refill around ${refillDate}. Visit us or order online for a seamless experience!`;
  return sendTextMessage(phoneNumber, message, customerId);
}

export async function sendCampaignMessage(
  phoneNumbers: string[],
  campaignMessage: string
) {
  const results = [];
  for (const phone of phoneNumbers) {
    const result = await sendTextMessage(phone, campaignMessage);
    results.push({ phone, ...result });
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return results;
}

export async function sendWelcomeMessage(
  phoneNumber: string,
  customerName: string,
  customerId?: number
) {
  const message = `Welcome to Suvidha Pharmacy, ${customerName}! 🏥 You're now part of our loyalty program. Earn points on every purchase and enjoy exclusive discounts. Thank you for choosing us!`;
  return sendTextMessage(phoneNumber, message, customerId);
}

export async function handleWebhook(body: any) {
  if (body.object !== "whatsapp_business_account") return;

  const entries = body.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      if (change.field !== "messages") continue;
      const statuses = change.value?.statuses || [];
      for (const status of statuses) {
        if (status.id) {
          await db
            .update(whatsappMessages)
            .set({
              status: status.status?.toUpperCase() || "UNKNOWN",
              ...(status.status === "delivered"
                ? { deliveredAt: new Date() }
                : {}),
            })
            .where(eq(whatsappMessages.messageId, status.id));
        }
      }
    }
  }
}

export async function getBusinessProfile() {
  if (!isConfigured()) {
    return { configured: false, error: "WhatsApp API credentials not set" };
  }

  try {
    const response = await axios.get(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/whatsapp_business_profile`,
      {
        headers: getHeaders(),
        params: { fields: "about,address,description,email,profile_picture_url,websites,vertical" },
      }
    );
    return { configured: true, profile: response.data?.data?.[0] };
  } catch (error: any) {
    return {
      configured: true,
      error: error.response?.data?.error?.message || error.message,
    };
  }
}

export const whatsappService = {
  isConfigured,
  sendTextMessage,
  sendTemplateMessage,
  sendDocumentMessage,
  sendInvoice,
  sendOrderUpdate,
  sendLoyaltyNotification,
  sendExpiryReminder,
  sendCampaignMessage,
  sendWelcomeMessage,
  handleWebhook,
  getBusinessProfile,
};
