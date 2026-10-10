const generateSlug = (title) => {
    return title
        .toLowerCase() //Converts the entire title to lowercase letters
        .trim() //Removes any accidental blank spaces from the very beginning or the very end of the title
        .replace(/[^a-z0-9\s-]/g, "") //Erases any special characters (like !, @, #, ?, or punctuation)
        .replace(/\s+/g, "-") //Spaces to hyphens
        .replace(/-+/g, "-"); //finds multiple bunched up hyphen (---) and squashes them down into just a single hyphen (-) 
};

module.exports = generateSlug;