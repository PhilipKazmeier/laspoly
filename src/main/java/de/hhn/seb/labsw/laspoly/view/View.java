/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.paint.Color
 *  javafx.scene.paint.PhongMaterial
 *  javafx.scene.text.Font
 */
package de.hhn.seb.labsw.laspoly.view;

import de.hhn.seb.labsw.laspoly.view.paint.Material;
import javafx.scene.paint.Color;
import javafx.scene.paint.PhongMaterial;
import javafx.scene.text.Font;

public final class View {

    public static final class FigurePositions {
        public static final Integer[] TOP_LEFT = new Integer[]{25, 6};
        public static final Integer[] TOP_RIGHT = new Integer[]{-25, 6};
        public static final Integer[] BOTTOM_LEFT = new Integer[]{25, -45};
        public static final Integer[] BOTTOM_RIGHT = new Integer[]{-25, -45};
    }

    public static final class Materials {
        public static final PhongMaterial FIELD_MATERIAL = Material.colored(GeneralColorResource.FIELD_COLOR);
        public static final PhongMaterial FIELD_MATERIAL_HOVER = Material.colored(GeneralColorResource.FIELD_COLOR_HOVER);
        public static final PhongMaterial FIELD_MORTG_MATERIAL = Material.colored(GeneralColorResource.FIELD_MORTG_COLOR);
        public static final PhongMaterial FIELD_MORTG_MATERIAL_HOVER = Material.colored(GeneralColorResource.FIELD_MORTG_COLOR_HOVER);
    }

    public static final class Fonts {
        public static final int FIELD_NAME_SIZE = 12;

        private Fonts() {
        }

        public static Font fieldFont(int size) {
            return Font.font((String)"Arial", (double)size);
        }
    }

    public static final class GeneralColorResource {
        public static final Color FIELD_COLOR = Color.rgb((int)175, (int)255, (int)125);
        public static final Color FIELD_COLOR_HOVER = Color.rgb((int)150, (int)255, (int)125);
        public static final Color FIELD_MORTG_COLOR = Color.rgb((int)255, (int)0, (int)0);
        public static final Color FIELD_MORTG_COLOR_HOVER = Color.rgb((int)255, (int)50, (int)50);
    }

    public static final class CanvasMeasures {
        public static final double COLOR_BAR_HEIGHT = 5.0;
        public static final double HALF_COLOR_BAR_HEIGHT = 2.5;
        public static final double COLOR_BAR_DEPTH = 37.5;
        public static final double HALF_COLOR_BAR_DEPTH = 18.75;
    }
}

