import mongoose, {Schema, model} from "mongoose";

const  playlistSchema = new Schema({
    name: {
        type: String,
        requried: true
    },
    description: {
        type: String,
        requried: true
    },
    coverImage: {
        type: {
            url: {
                type: String,
                default: ""
            },
            public_id: {
                type: String,
                default: ""
            }
        }
    },
    videos: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps: true})

export const Playlist = model("Playlist", playlistSchema);