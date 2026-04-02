import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const FROM = process.env.EMAIL_FROM || '"ShopHub" <noreply@shophub.com>';

// ---- HTML template helpers ----

const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ShopHub</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f4f4f5; margin:0; padding:0; }
    .wrapper { max-width:600px; margin:0 auto; padding:24px 16px; }
    .card { background:#fff; border-radius:12px; padding:32px; box-shadow:0 1px 4px rgba(0,0,0,.08); }
    .header { text-align:center; margin-bottom:28px; }
    .logo { font-size:24px; font-weight:700; color:#4f46e5; }
    h1 { font-size:20px; color:#111827; margin:0 0 16px; }
    p { color:#4b5563; line-height:1.6; margin:0 0 12px; }
    .btn { display:inline-block; padding:12px 24px; background:#4f46e5; color:#fff !important;
           text-decoration:none; border-radius:8px; font-weight:600; margin:16px 0; }
    table { width:100%; border-collapse:collapse; margin:16px 0; }
    th { background:#f9fafb; padding:10px 12px; text-align:left; font-size:13px; color:#6b7280;
         border-bottom:1px solid #e5e7eb; }
    td { padding:10px 12px; font-size:14px; color:#374151; border-bottom:1px solid #f3f4f6; }
    .badge { display:inline-block; padding:2px 10px; border-radius:999px; font-size:12px;
             font-weight:600; background:#dbeafe; color:#1d4ed8; }
    .total-row td { font-weight:700; color:#111827; background:#f9fafb; }
    .footer { text-align:center; margin-top:24px; font-size:12px; color:#9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo">🛍️ ShopHub</div>
      </div>
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ShopHub. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const statusBadgeColor = {
  pending:    { bg: '#fef3c7', text: '#d97706' },
  confirmed:  { bg: '#dbeafe', text: '#1d4ed8' },
  processing: { bg: '#ede9fe', text: '#7c3aed' },
  shipped:    { bg: '#d1fae5', text: '#065f46' },
  delivered:  { bg: '#dcfce7', text: '#15803d' },
  cancelled:  { bg: '#fee2e2', text: '#b91c1c' },
  refunded:   { bg: '#f3f4f6', text: '#374151' },
};

// ============================================================
// EMAIL FUNCTIONS
// ============================================================

/**
 * Send order confirmation to customer.
 */
export const sendOrderConfirmation = async (email, order) => {
  try {
    const transporter = createTransporter();

    const itemsHtml = (order.order_items || []).map((item) => `
      <tr>
        <td>${item.product_name}</td>
        <td>${item.quantity}</td>
        <td>${formatCurrency(item.unit_price)}</td>
        <td>${formatCurrency(item.total_price)}</td>
      </tr>
    `).join('');

    const addr = order.shipping_address || {};

    const content = `
      <h1>Order Confirmed! 🎉</h1>
      <p>Hi ${addr.full_name || 'there'},</p>
      <p>Thank you for your order! We've received it and it's being processed.</p>

      <p><strong>Order ID:</strong> <span class="badge">#${order.id.slice(0, 8).toUpperCase()}</span></p>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr><td colspan="3">Subtotal</td><td>${formatCurrency(order.subtotal)}</td></tr>
          <tr><td colspan="3">Tax</td><td>${formatCurrency(order.tax_amount)}</td></tr>
          <tr><td colspan="3">Shipping</td><td>${order.shipping_amount === 0 ? 'Free' : formatCurrency(order.shipping_amount)}</td></tr>
          <tr class="total-row"><td colspan="3">Total</td><td>${formatCurrency(order.total_amount)}</td></tr>
        </tfoot>
      </table>

      <p><strong>Shipping to:</strong><br/>
        ${addr.address_line1}${addr.address_line2 ? ', ' + addr.address_line2 : ''}<br/>
        ${addr.city}, ${addr.state} ${addr.zip}<br/>
        ${addr.country}
      </p>

      <p>We'll notify you when your order ships.</p>
    `;

    const info = await transporter.sendMail({
      from: FROM,
      to: email,
      subject: `Order Confirmed – #${order.id.slice(0, 8).toUpperCase()}`,
      html: baseTemplate(content),
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email] sendOrderConfirmation failed:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Notify customer when order status changes.
 */
export const sendOrderStatusUpdate = async (email, order) => {
  try {
    const transporter = createTransporter();
    const statusColors = statusBadgeColor[order.status] || statusBadgeColor.pending;

    const content = `
      <h1>Order Status Updated</h1>
      <p>Your order status has been updated.</p>

      <p><strong>Order ID:</strong> <span class="badge">#${order.id.slice(0, 8).toUpperCase()}</span></p>
      <p>
        <strong>New Status:</strong>
        <span style="display:inline-block;padding:2px 12px;border-radius:999px;
          background:${statusColors.bg};color:${statusColors.text};font-weight:600;font-size:13px;">
          ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </p>

      ${order.tracking_number ? `<p><strong>Tracking Number:</strong> ${order.tracking_number}</p>` : ''}

      <p>Log in to ShopHub to view your full order details.</p>
    `;

    const info = await transporter.sendMail({
      from: FROM,
      to: email,
      subject: `Order Update – #${order.id.slice(0, 8).toUpperCase()} is now ${order.status}`,
      html: baseTemplate(content),
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email] sendOrderStatusUpdate failed:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Notify vendor when they receive a new order.
 */
export const sendVendorNewOrder = async (email, order, vendorItems) => {
  try {
    const transporter = createTransporter();

    const itemsHtml = vendorItems.map((item) => `
      <tr>
        <td>${item.product_name}</td>
        <td>${item.quantity}</td>
        <td>${formatCurrency(item.unit_price)}</td>
        <td>${formatCurrency(item.total_price)}</td>
      </tr>
    `).join('');

    const vendorTotal = vendorItems.reduce((sum, i) => sum + parseFloat(i.total_price), 0);

    const content = `
      <h1>New Order Received! 📦</h1>
      <p>You have received a new order on ShopHub.</p>

      <p><strong>Order ID:</strong> <span class="badge">#${order.id.slice(0, 8).toUpperCase()}</span></p>

      <table>
        <thead>
          <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr class="total-row"><td colspan="3">Your Total</td><td>${formatCurrency(vendorTotal)}</td></tr>
        </tfoot>
      </table>

      <p>Please log in to your Vendor Dashboard to start processing this order.</p>
    `;

    const info = await transporter.sendMail({
      from: FROM,
      to: email,
      subject: `New Order – #${order.id.slice(0, 8).toUpperCase()}`,
      html: baseTemplate(content),
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email] sendVendorNewOrder failed:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send password reset email.
 */
export const sendPasswordReset = async (email, resetLink) => {
  try {
    const transporter = createTransporter();

    const content = `
      <h1>Reset Your Password</h1>
      <p>We received a request to reset the password for your ShopHub account.</p>
      <p>Click the button below to set a new password. This link expires in 1 hour.</p>
      <a href="${resetLink}" class="btn">Reset Password</a>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
    `;

    const info = await transporter.sendMail({
      from: FROM,
      to: email,
      subject: 'Reset your ShopHub password',
      html: baseTemplate(content),
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email] sendPasswordReset failed:', err.message);
    return { success: false, error: err.message };
  }
};
