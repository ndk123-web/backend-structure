import { Schema , model } from "mongoose";
import { User } from "./user.models.js";

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

export const Subscription = new model("Subscription" , subscriptionScema); 