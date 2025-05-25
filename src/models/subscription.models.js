import { Schema , Model } from "mongoose";
import { User } from "./user.models";

const subscriptionScema = new Schema({
    subscriber : {
        type : Schema.Types.ObjectId,
        ref : "User"   
    },
    channel : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }
} , 
{
    timestamps : true  
}
) 

export const Subscription = new Model("Subscription" , subscriptionScema); 