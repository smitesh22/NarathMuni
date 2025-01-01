import express from "express";
import { stripe } from "../../server";
import Stripe from "stripe";
import {userService} from "../user/user.service";

export default async function(req: express.Request, res: express.Response) {
    try {
        switch (req.method) {
            case "POST":
                if(req.url === "/create-payment") {
                    try {
                        const {priceId, userId, userEmail, userName} = req.body;

                        if (!priceId || !userId) {
                            res.status(400).send({error: "PriceId and userId are required"});
                            return;
                        }
                        console.log("Creating payment for user", userId);

                        const customer = await stripe.customers.create({
                            name: userName,
                            email: userEmail,
                            metadata: {
                                userId: userId
                            }
                        });

                        const subscription = await stripe.subscriptions.create({
                            customer: customer.id,
                            items: [
                                {
                                    price: priceId
                                }
                            ],
                            payment_behavior: "default_incomplete",
                            expand: ["latest_invoice.payment_intent"]
                        })

                        const latestInvoice = subscription.latest_invoice;

                        if (latestInvoice && typeof latestInvoice !== "string" && latestInvoice.payment_intent) {
                            const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;
                            res.status(201).send({
                                clientSecret: paymentIntent.client_secret,
                            });
                        } else {
                            res.status(500).send({error: "Failed to retrieve payment intent from subscription"});
                        }
                    } catch (error) {
                        console.error(error);
                        res.status(500).send({error: "Failed to create subscription"});
                    }
                    return;
                }else if(req.url === "/verify-payment") {
                    try{
                        const {userId, subscriptionType} = req.body;

                        if (!userId || !subscriptionType) {
                            res.status(400).send({error: "userId and subscriptionType are required"});
                            return;
                        }

                        const user = await userService.getUserById(userId);

                        if(!user){
                            res.status(404).send({error: `User with id ${userId} not found`});
                            return;
                        }

                        const userExtensions = user.extensions;
                        await userService.updateUser(userId, {
                            privileged: true,
                            extensions: {
                                ...userExtensions,
                                userTypes: {
                                    paidUser: true,
                                    subscriptionType: subscriptionType,
                                    subscriptionStartDate: new Date().toISOString(),
                                    stripeCustomerId: "TODO"
                                }
                        }
                        });
                        res.status(200).send({message: "Payment verified successfully!"});
                    }catch (error) {
                        console.error(error);
                        res.status(500).send({error: "Failed to verify payment"});
                    }
                    return;
                }
                return;
            default:
                res.status(400).send("Method Not Allowed");
                return;
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Internal Server Error" });
    }
}
