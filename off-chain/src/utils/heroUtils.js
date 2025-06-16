export const getClass = (classId) => {
    const classNum = Number(classId);
    switch(classNum) {
        case 1: return "Net Runner";
        case 2: return "Street Brawler";
        case 3: return "Slicer";
        case 4: return "Tech Nomad";
        default: return `Unknown class (${classNum})`;
    }
}; 