import resend from "../../config/mailer/resend";
import { EMAIL_SENDER, NODE_ENV } from "../../constants/env";
import { MailParams } from "../../constants/types/utils.types";

const getFromEmail = () =>
  NODE_ENV === "development" ? "onboarding@resend.dev" : EMAIL_SENDER;
const getToEmail = (to: string) =>
  NODE_ENV === "development" ? "delivered@resend.dev" : to;
export const sendMail = async ({ to, subject, text, html }: MailParams) =>
  await resend.emails.send({
    from: getFromEmail(),
    to: getToEmail(to),
    subject,
    text,
    html,
  });
