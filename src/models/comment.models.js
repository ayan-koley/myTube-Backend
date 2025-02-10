import mongoose, {Schema, model} from "mongoose";

const commentSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video",
        requried: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        requried: true
    }
},{timestamps: true})

export const Comment = model("Comment", commentSchema);