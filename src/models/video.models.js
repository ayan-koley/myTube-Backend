import mongoose, {Schema, model} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile: {
        type: {
            url: String,
            public_id: String
        }
    },
    thumbnail: {
        type: {
            url: String,
            public_id: String
        }
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    }
}, {timestamps: true})

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = model("Video", videoSchema);