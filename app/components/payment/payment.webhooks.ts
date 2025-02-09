import express from "express";
import Stripe from "stripe";
import { STRIPE_KEY, STRIPE_WEBHOOK_SECRET } from "../../secrets/secrets";
import { userService } from "../user/user.service";

const stripe = new Stripe(STRIPE_KEY);

export const stripeWebhookHandler = async (
    req: express.Request,
    res: express.Response
): Promise<void> => {
  const sig = req.headers["stripe-signature"] as string;

  if (!sig || !STRIPE_WEBHOOK_SECRET) {
    console.error("Missing signature or webhook secret");
    return; // res.status(400).send("Webhook Error: Missing signature or secret");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    console.log(`Webhook received: ${event.type}`);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return; // res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    res.json({ received: true });
  } catch (e) {
    console.error("Error handling webhook event:", e);
    res.status(500).send("Webhook handler failed");
  }
};

const handleSubscriptionUpdated = async (subscription: Stripe.Subscription): Promise<void> => {
  try {
    if (subscription.cancel_at_period_end) {
      const customerId = subscription.customer as string;
      const user = await userService.getUserByCustomerId(customerId);

      if (!user) {
        console.error(`No customer found with customer id: ${customerId}`);
        return;
      }

      await userService.updateUser(user.id, {
        extensions: {
          ...user.extensions,
          userTypes: {
            ...user.extensions?.userTypes,
            subscriptionEndDate: new Date(subscription.current_period_end * 1000).toISOString(),
          },
        },
      });
    }
  } catch (e) {
    console.error("Error while handling subscription update", e);
  }
};

const handleSubscriptionDeleted = async (subscription: Stripe.Subscription): Promise<void> => {
  try {
    const customerId = subscription.customer as string;
    const user = await userService.getUserByCustomerId(customerId);

    if (!user) {
      console.error(`No customer found with customer id: ${customerId}`);
      return;
    }

    await userService.updateUser(user.id, {
      extensions: {
        ...user.extensions,
        userTypes: {
          subscriptionType: null,
          customerId: null,
          subscriptionStartDate: null,
          subscriptionEndDate: null,
        },
      },
    });

    console.log(`Cancelled subscription for user ${user.id}.`);
  } catch (e) {
    console.error("Error while handling subscription deletion", e);
  }
};
