const getTokenFromHeader = (req) => {
    //get token from header
    const headerobj = req.headers;
    const token = headerobj["authorization"].split(" ")[1];
if (token !== undefined) {
    return token;
}else {
    return {
        status: "failed",
        message: "There is no token attached to the header"
    }
}
}

module.exports = getTokenFromHeader;