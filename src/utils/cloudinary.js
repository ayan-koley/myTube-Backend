import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_USERNAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret:  process.env.CLOUDINARY_API_SECRECT
})

const uploadOnCloudinary = async(localFilePath) => {
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlink(localFilePath);
        return null;
    }
}

const deleteImageOnCloudinary = async(public_id)=> {
    try {
        if(!public_id) return null;
        const response = await cloudinary.uploader.destroy(public_id, {
            resource_type: 'image'
        })
        return response;
    } catch (error) {
        return null;
    }
}
const deleteVideoOnCloudinary = async(public_id)=> {
    try {
        if(!public_id) return null;
        const response = await cloudinary.uploader.destroy(public_id, {
            resource_type: 'video'
        })
        return response;
    } catch (error) {
        return null;
    }
}

export {uploadOnCloudinary, deleteImageOnCloudinary, deleteVideoOnCloudinary};