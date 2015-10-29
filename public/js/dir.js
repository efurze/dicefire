$(function() {

    window.Dir = {
        obj: {
            NW:     0,
            N:      1,
            NE:     2,
            SE:     3,
            S:      4,
            SW:     5,
        },

        array: [
            "NW", "N", "NE", "SE", "S", "SW"
        ],

        // Can the move be legally made? Do this separately from nextHex because the rules are somewhat complex
        // and different. Basically, it boils down to checking if it goes off an edge of the board (which means,
        // for example, NE and SE are the same).
        isLegal: function(hex, dir) {
            switch (dir) {
                case Dir.obj.N:
                case "N":
                    return hex.num() - (2 * Hex.NUM_WIDE) >= 0;

                case Dir.obj.NE:
                case "NE":
                case Dir.obj.SE:
                case "SE":
                    return ((hex.num() + 1) % (Hex.NUM_WIDE * 2));

                case Dir.obj.S:
                case "S":
                    return hex.num() + (2 * Hex.NUM_WIDE) < Hex.TOTAL_HEXES;

                case Dir.obj.NW:
                case "NW":
                case Dir.obj.SW:
                case "SW":
                    return (hex.num() % (Hex.NUM_WIDE * 2));

                default:
                    return false;
            }
        },

        // What is the hex you reach when you move a given direction from the current hex?
        nextHex: function(hex, dir) {

            // Is it an illegal direction? If so, just return null.
            if (!Dir.isLegal(hex, dir)) {
                return null;
            }

            var x = hex.x();
            var y = hex.y();

            var oldHexNum = hex.num();
            var newHexNum;

            // This is complicated because it has to look for edge conditions both N-S and E-W. The E-W direction
            // depends a bit on which row you're in. Only every other row can even have a problem.
            switch (dir) {
                case Dir.obj.NW: 
                case "NW":
                    newHexNum = Math.floor(oldHexNum / Hex.NUM_WIDE) % 2 ? oldHexNum - Hex.NUM_WIDE : oldHexNum - Hex.NUM_WIDE - 1;
                    break;

                case Dir.obj.N:
                case "N":
                    newHexNum = oldHexNum - (2 * Hex.NUM_WIDE);
                    break;

                case Dir.obj.NE:
                case "NE":
                    newHexNum = Math.floor(oldHexNum / Hex.NUM_WIDE) % 2 ? oldHexNum - Hex.NUM_WIDE + 1 : oldHexNum - Hex.NUM_WIDE;
                    break;

                case Dir.obj.SE:
                case "SE":
                    newHexNum = Math.floor(oldHexNum / Hex.NUM_WIDE) % 2 ? oldHexNum + Hex.NUM_WIDE + 1 : oldHexNum + Hex.NUM_WIDE;
                    break;

                case Dir.obj.S:
                case "S":
                    newHexNum = oldHexNum + (2 * Hex.NUM_WIDE);
                    break;

                case Dir.obj.SW:
                case "SW":
                    newHexNum = Math.floor(oldHexNum / Hex.NUM_WIDE) % 2 ? oldHexNum + Hex.NUM_WIDE : oldHexNum + Hex.NUM_WIDE - 1;
                    break;    

            }


            return Hex.get(newHexNum);
        }
    };
});