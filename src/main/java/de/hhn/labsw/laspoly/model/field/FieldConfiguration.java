package de.hhn.labsw.laspoly.model.field;

import de.hhn.labsw.laspoly.model.field.specialfield.ActionField;
import de.hhn.labsw.laspoly.model.field.specialfield.Casino;
import de.hhn.labsw.laspoly.model.field.specialfield.FreeParkingField;
import de.hhn.labsw.laspoly.model.field.specialfield.GoToPrison;
import de.hhn.labsw.laspoly.model.field.specialfield.PayToCasinoField;
import de.hhn.labsw.laspoly.model.field.specialfield.StartField;
import javafx.scene.paint.Color;

/**
 * This class contains relevant Objects for the initial configuration of  the fields.
 */
public final class FieldConfiguration {
    /**
     * The colours of the gamescene groups.
     */
    public static final Color[] GROUP_COLOURS = {
            Color.BROWN,
            Color.DEEPPINK,
            Color.TURQUOISE,
            Color.VIOLET,
            Color.MISTYROSE,
            Color.ORANGE,
            Color.LIGHTGREEN,
            Color.RED,
            Color.YELLOW,
            Color.DARKVIOLET,
            Color.DARKGREEN,
            Color.ROYALBLUE
    };
    /**
     * The list of rents for the streets.
     * Needs to be updated.
     * TODO: we need to make higher rents and prices than in the prototype.
     * This is a requirement which arose during the presentation.
     */
    public static final int[][] RENTS = {
            {}, {},
            {}, {},
            {}, {},
            {}, {},
            {}, {},
            {}, {},
            {}, {},
            {}, {},
            {}, {},
            {}, {},
            {}, {},
            {}, {}
    };
    /**
     * The 40+ fields of the board.
     */
    // @formatter:off // do not remove this comment line.
    public static final Field[] FIELDS = {
            new StartField(),
            new Street(1,       "Arndt\nAvenue",        GROUP_COLOURS[0],   600,    RENTS[0]),
            new ActionField(2),
            new Street(3,       "Frank\nSinatra\nWeg",  GROUP_COLOURS[1],   600,    RENTS[1]),
            new Street(4,       "Winnick\nWeg",         GROUP_COLOURS[1],   600,    RENTS[2]),
            new TrainStation(5, "Bahnhof\nCeasar"),
            new Street(6,       "Rochelle-\nStraße",    GROUP_COLOURS[2],   600,    RENTS[3]),
            new ActionField(7),
            new Street(8,       "Jacoby\nStraße",       GROUP_COLOURS[2],   600,    RENTS[4]),
            new Street(9,       "Singer\nWeg",          GROUP_COLOURS[2],   600,    RENTS[5]),
            new FreeParkingField(),
            new Street(11,      "Fulano\nStraße",       GROUP_COLOURS[3],   600,    RENTS[6]),
            new ActionField(12),
            new Street(13,      "Westallee",            GROUP_COLOURS[4],   600,    RENTS[7]),
            new Street(14,      "Monterro\nStraße",     GROUP_COLOURS[4],   600,    RENTS[8]),
            new TrainStation(15,"Bahnhof\nWestgate"),
            new Street(16,      "Hardwick\nStraße",     GROUP_COLOURS[5],   600,    RENTS[9]),
            new ActionField(17),
            new Street(18,      "Parkstraße",           GROUP_COLOURS[5],   600,    RENTS[10]),
            new Street(19,      "Casino\nStraße",       GROUP_COLOURS[5],   600,    RENTS[11]),
            new Casino(),
            new Street(21,      "St Louis\nPlatz",      GROUP_COLOURS[6],   600,    RENTS[12]),
            new ActionField(22),
            new Street(23,      "Bellagio\nGasse",      GROUP_COLOURS[7],   600,    RENTS[13]),
            new Street(24,      "Kennedy\nAllee",       GROUP_COLOURS[7],   600,    RENTS[14]),
            new TrainStation(25,"Bahnhof\nLinq"),
            new Street(26,      "Theresia\nFreeway",    GROUP_COLOURS[8],   600,    RENTS[15]),
            new ActionField(27),
            new Street(28,      "Douglas\nPromenade",   GROUP_COLOURS[8],   600,    RENTS[16]),
            new Street(29,      "Heaven\nAvenue",       GROUP_COLOURS[8],   600,    RENTS[17]),
            new GoToPrison(),
            new Street(31,      "Edison\nWalker\nStraße",GROUP_COLOURS[9],  600,    RENTS[18]),
            new ActionField(32),
            new Street(33,      "Crosswood\nAllee",     GROUP_COLOURS[10],  600,    RENTS[19]),
            new Street(34,      "Showcase\nRoad",       GROUP_COLOURS[10],  600,    RENTS[20]),
            new TrainStation(35,"Grand-\nCentral-\nBahnhof"),
            new PayToCasinoField(),
            new Street(37,      "Winchester\n95",       GROUP_COLOURS[11],  600,    RENTS[21]),
            new Street(38,      "Pardise\nRing",        GROUP_COLOURS[11],  600,    RENTS[22]),
            new Street(39,      "Las Vegas\nStrip",     GROUP_COLOURS[11],  600,    RENTS[23]),
            // TODO: Gefängnis muss noch in die Mitte des Feldes
    };
    // @formatter:on // do not remove this comment line.
    /**
     * the 4 * 3  = 12 FieldGroups.
     * Only by existence they can  influence the members, so don't delete these group!
     */
    public static final FieldGroup[] FIELD_GROUPS = {
            new FieldGroup(FIELDS[1]),
            new FieldGroup(FIELDS[3], FIELDS[4]),
            new FieldGroup(FIELDS[6], FIELDS[8], FIELDS[9]),
            new FieldGroup(FIELDS[11]),
            new FieldGroup(FIELDS[13], FIELDS[14]),
            new FieldGroup(FIELDS[16], FIELDS[18], FIELDS[19]),
            new FieldGroup(FIELDS[21]),
            new FieldGroup(FIELDS[23], FIELDS[24]),
            new FieldGroup(FIELDS[26], FIELDS[28], FIELDS[29]),
            new FieldGroup(FIELDS[31]),
            new FieldGroup(FIELDS[33], FIELDS[34]),
            new FieldGroup(FIELDS[37], FIELDS[38], FIELDS[39]),
    };
}
