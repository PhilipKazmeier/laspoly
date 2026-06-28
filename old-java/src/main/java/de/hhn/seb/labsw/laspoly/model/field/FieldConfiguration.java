/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.paint.Color
 */
package de.hhn.seb.labsw.laspoly.model.field;

import de.hhn.seb.labsw.laspoly.model.field.Attraction;
import de.hhn.seb.labsw.laspoly.model.field.Field;
import de.hhn.seb.labsw.laspoly.model.field.FieldGroup;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.model.field.Street;
import de.hhn.seb.labsw.laspoly.model.field.TrainStation;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.ActionField;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.Casino;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.FreeParkingField;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.GoToPrisonField;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.PayToCasinoField;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.Prison;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.StartField;
import de.hhn.seb.labsw.laspoly.model.priceinfo.StreetPriceInfo;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import java.util.logging.Logger;
import javafx.scene.paint.Color;

public final class FieldConfiguration {
    public static final int TRACK_SIZE = 40;
    private static boolean loaded;
    private static Color[] groupColors;
    private static StreetPriceInfo[] stRents;
    private static Property[] properties;
    private static Field[] fields;

    private FieldConfiguration() {
    }

    public static void load() {
        Logger.getAnonymousLogger().info("Start loading field configuration");
        FieldConfiguration.loadGroupColors();
        Logger.getAnonymousLogger().info("Group colors loading finished");
        FieldConfiguration.loadStreetPriceInfos();
        Logger.getAnonymousLogger().info("Street price infos loading finished");
        FieldConfiguration.loadProperties();
        Logger.getAnonymousLogger().info("Properties loading finished");
        FieldConfiguration.loadFields();
        Logger.getAnonymousLogger().info("Fields loading finished");
        FieldConfiguration.loadFieldGroups();
        Logger.getAnonymousLogger().info("Field groups loading finished");
        loaded = true;
    }

    private static void loadGroupColors() {
        groupColors = new Color[12];
        FieldConfiguration.groupColors[0] = Color.BROWN;
        FieldConfiguration.groupColors[1] = Color.DEEPPINK;
        FieldConfiguration.groupColors[2] = Color.TURQUOISE;
        FieldConfiguration.groupColors[3] = Color.VIOLET;
        FieldConfiguration.groupColors[4] = Color.MISTYROSE;
        FieldConfiguration.groupColors[5] = Color.ORANGE;
        FieldConfiguration.groupColors[6] = Color.LIGHTGREEN;
        FieldConfiguration.groupColors[7] = Color.RED;
        FieldConfiguration.groupColors[8] = Color.YELLOW;
        FieldConfiguration.groupColors[9] = Color.DARKVIOLET;
        FieldConfiguration.groupColors[10] = Color.DARKGREEN;
        FieldConfiguration.groupColors[11] = Color.ROYALBLUE;
    }

    private static void loadStreetPriceInfos() {
        stRents = new StreetPriceInfo[24];
        FieldConfiguration.stRents[0] = new StreetPriceInfo(60, 30, 30, 30, 60, 230, 2, 10, 30, 90, 170, 260);
        FieldConfiguration.stRents[1] = new StreetPriceInfo(70, 35, 40, 40, 80, 460, 4, 20, 60, 180, 340, 520);
        FieldConfiguration.stRents[2] = new StreetPriceInfo(80, 40, 40, 40, 80, 575, 5, 25, 75, 225, 425, 650);
        FieldConfiguration.stRents[3] = new StreetPriceInfo(100, 50, 60, 60, 120, 690, 6, 30, 90, 270, 510, 780);
        FieldConfiguration.stRents[4] = new StreetPriceInfo(100, 50, 60, 60, 120, 805, 7, 35, 105, 315, 595, 910);
        FieldConfiguration.stRents[5] = new StreetPriceInfo(120, 60, 60, 60, 120, 920, 8, 40, 120, 360, 680, 1040);
        FieldConfiguration.stRents[6] = new StreetPriceInfo(130, 65, 65, 65, 130, 750, 10, 50, 100, 300, 550, 850);
        FieldConfiguration.stRents[7] = new StreetPriceInfo(140, 70, 75, 75, 150, 1265, 11, 55, 165, 495, 935, 1430);
        FieldConfiguration.stRents[8] = new StreetPriceInfo(150, 75, 75, 75, 150, 1380, 12, 60, 180, 540, 1020, 1560);
        FieldConfiguration.stRents[9] = new StreetPriceInfo(180, 90, 100, 100, 200, 1610, 14, 70, 210, 630, 1190, 1820);
        FieldConfiguration.stRents[10] = new StreetPriceInfo(180, 90, 100, 100, 200, 1725, 15, 75, 225, 675, 1275, 1950);
        FieldConfiguration.stRents[11] = new StreetPriceInfo(200, 100, 100, 100, 200, 1840, 16, 80, 240, 720, 1360, 2080);
        FieldConfiguration.stRents[12] = new StreetPriceInfo(220, 110, 110, 110, 220, 1350, 18, 90, 180, 540, 990, 1530);
        FieldConfiguration.stRents[13] = new StreetPriceInfo(240, 120, 120, 120, 240, 2185, 19, 95, 285, 855, 1615, 2470);
        FieldConfiguration.stRents[14] = new StreetPriceInfo(240, 120, 120, 120, 240, 2300, 20, 100, 300, 900, 1700, 2600);
        FieldConfiguration.stRents[15] = new StreetPriceInfo(260, 130, 140, 140, 280, 2530, 22, 110, 330, 990, 1870, 2860);
        FieldConfiguration.stRents[16] = new StreetPriceInfo(260, 130, 140, 140, 280, 2645, 23, 115, 345, 1035, 1955, 2990);
        FieldConfiguration.stRents[17] = new StreetPriceInfo(280, 140, 140, 140, 280, 2760, 24, 120, 360, 1080, 2040, 3120);
        FieldConfiguration.stRents[18] = new StreetPriceInfo(300, 150, 150, 150, 300, 1950, 26, 130, 260, 780, 1430, 2210);
        FieldConfiguration.stRents[19] = new StreetPriceInfo(320, 160, 170, 170, 340, 3335, 29, 145, 435, 1305, 2465, 3770);
        FieldConfiguration.stRents[20] = new StreetPriceInfo(340, 170, 170, 170, 340, 3450, 30, 150, 450, 1350, 2550, 3900);
        FieldConfiguration.stRents[21] = new StreetPriceInfo(360, 180, 200, 200, 400, 4140, 36, 180, 540, 1620, 3060, 4680);
        FieldConfiguration.stRents[22] = new StreetPriceInfo(360, 180, 200, 200, 400, 4370, 38, 190, 570, 1710, 3230, 4940);
        FieldConfiguration.stRents[23] = new StreetPriceInfo(400, 200, 200, 200, 400, 4600, 40, 200, 600, 1800, 3400, 5200);
    }

    private static void loadProperties() {
        properties = new Property[30];
        FieldConfiguration.properties[0] = new Street(1, "Arndt Avenue", groupColors[0], stRents[0]);
        FieldConfiguration.properties[1] = new Street(3, "Frank Sinatra Route", groupColors[1], stRents[1]);
        FieldConfiguration.properties[2] = new Street(4, "Winnick Way", groupColors[1], stRents[2]);
        FieldConfiguration.properties[3] = new TrainStation(5, "Caesar Station");
        FieldConfiguration.properties[4] = new Street(6, "Rochelle Street", groupColors[2], stRents[3]);
        FieldConfiguration.properties[5] = new Street(8, "Jacoby Street", groupColors[2], stRents[4]);
        FieldConfiguration.properties[6] = new Street(9, "Singer Route", groupColors[2], stRents[5]);
        FieldConfiguration.properties[7] = new Street(11, "Fulano", groupColors[3], stRents[6]);
        FieldConfiguration.properties[8] = new Attraction(12, "Big Wheel", DataLoader.getInstance().getGameImage(GameImage.IC_WHEEL));
        FieldConfiguration.properties[9] = new Street(13, "West Avenue", groupColors[4], stRents[7]);
        FieldConfiguration.properties[10] = new Street(14, "Monterro Freeway", groupColors[4], stRents[8]);
        FieldConfiguration.properties[11] = new TrainStation(15, "Westgate Station");
        FieldConfiguration.properties[12] = new Street(16, "Hardwick Street", groupColors[5], stRents[9]);
        FieldConfiguration.properties[13] = new Street(18, "Park Road", groupColors[5], stRents[10]);
        FieldConfiguration.properties[14] = new Street(19, "Casino Street", groupColors[5], stRents[11]);
        FieldConfiguration.properties[15] = new Street(21, "St Louis Square", groupColors[6], stRents[12]);
        FieldConfiguration.properties[16] = new Street(23, "Bellagio Path", groupColors[7], stRents[13]);
        FieldConfiguration.properties[17] = new Street(24, "Kennedy Avenue", groupColors[7], stRents[14]);
        FieldConfiguration.properties[18] = new TrainStation(25, "Linq Station");
        FieldConfiguration.properties[19] = new Street(26, "Theresia Freeway", groupColors[8], stRents[15]);
        FieldConfiguration.properties[20] = new Attraction(27, "Circus", DataLoader.getInstance().getGameImage(GameImage.IC_CIRCUS));
        FieldConfiguration.properties[21] = new Street(28, "Douglas Promenade", groupColors[8], stRents[16]);
        FieldConfiguration.properties[22] = new Street(29, "Heaven Avenue", groupColors[8], stRents[17]);
        FieldConfiguration.properties[23] = new Street(31, "Edison Walker Street", groupColors[9], stRents[18]);
        FieldConfiguration.properties[24] = new Street(33, "Crosswood Avenue", groupColors[10], stRents[19]);
        FieldConfiguration.properties[25] = new Street(34, "Showcase Road", groupColors[10], stRents[20]);
        FieldConfiguration.properties[26] = new TrainStation(35, "Grand Central Station");
        FieldConfiguration.properties[27] = new Street(37, "Winchester 95", groupColors[11], stRents[21]);
        FieldConfiguration.properties[28] = new Street(38, "Pardise Road", groupColors[11], stRents[22]);
        FieldConfiguration.properties[29] = new Street(39, "Las Vegas Strip", groupColors[11], stRents[23]);
    }

    private static void loadFields() {
        fields = new Field[41];
        FieldConfiguration.fields[0] = new StartField();
        FieldConfiguration.fields[1] = properties[0];
        FieldConfiguration.fields[2] = new PayToCasinoField(2);
        FieldConfiguration.fields[3] = properties[1];
        FieldConfiguration.fields[4] = properties[2];
        FieldConfiguration.fields[5] = properties[3];
        FieldConfiguration.fields[6] = properties[4];
        FieldConfiguration.fields[7] = new ActionField(7);
        FieldConfiguration.fields[8] = properties[5];
        FieldConfiguration.fields[9] = properties[6];
        FieldConfiguration.fields[10] = new FreeParkingField();
        FieldConfiguration.fields[11] = properties[7];
        FieldConfiguration.fields[12] = properties[8];
        FieldConfiguration.fields[13] = properties[9];
        FieldConfiguration.fields[14] = properties[10];
        FieldConfiguration.fields[15] = properties[11];
        FieldConfiguration.fields[16] = properties[12];
        FieldConfiguration.fields[17] = new ActionField(17);
        FieldConfiguration.fields[18] = properties[13];
        FieldConfiguration.fields[19] = properties[14];
        FieldConfiguration.fields[20] = new Casino();
        FieldConfiguration.fields[21] = properties[15];
        FieldConfiguration.fields[22] = new ActionField(22);
        FieldConfiguration.fields[23] = properties[16];
        FieldConfiguration.fields[24] = properties[17];
        FieldConfiguration.fields[25] = properties[18];
        FieldConfiguration.fields[26] = properties[19];
        FieldConfiguration.fields[27] = properties[20];
        FieldConfiguration.fields[28] = properties[21];
        FieldConfiguration.fields[29] = properties[22];
        FieldConfiguration.fields[30] = new GoToPrisonField();
        FieldConfiguration.fields[31] = properties[23];
        FieldConfiguration.fields[32] = new ActionField(32);
        FieldConfiguration.fields[33] = properties[24];
        FieldConfiguration.fields[34] = properties[25];
        FieldConfiguration.fields[35] = properties[26];
        FieldConfiguration.fields[36] = new PayToCasinoField(36);
        FieldConfiguration.fields[37] = properties[27];
        FieldConfiguration.fields[38] = properties[28];
        FieldConfiguration.fields[39] = properties[29];
        FieldConfiguration.fields[40] = new Prison();
    }

    private static void loadFieldGroups() {
        new FieldGroup(properties[3], properties[11], properties[18], properties[26]);
        new FieldGroup(properties[8], properties[20]);
        new FieldGroup(properties[0]);
        new FieldGroup(properties[1], properties[2]);
        new FieldGroup(properties[4], properties[5], properties[6]);
        new FieldGroup(properties[7]);
        new FieldGroup(properties[9], properties[10]);
        new FieldGroup(properties[12], properties[13], properties[14]);
        new FieldGroup(properties[15]);
        new FieldGroup(properties[16], properties[17]);
        new FieldGroup(properties[19], properties[21], properties[22]);
        new FieldGroup(properties[23]);
        new FieldGroup(properties[24], properties[25]);
        new FieldGroup(properties[27], properties[28], properties[29]);
    }

    public static Field getField(int index) {
        if (!loaded) {
            FieldConfiguration.load();
        }
        return fields[index];
    }

    public static Field[] getFields() {
        if (!loaded) {
            FieldConfiguration.load();
        }
        return fields;
    }

    public static int wrapPosition(int currentPosition, int steps) {
        return Math.floorMod(currentPosition + steps, TRACK_SIZE);
    }

    public static Property[] getProperties() {
        if (!loaded) {
            FieldConfiguration.load();
        }
        return properties;
    }

    public String toString() {
        return this.getClass().getName() + "{}";
    }
}

