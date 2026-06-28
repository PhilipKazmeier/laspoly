package de.hhn.labsw.laspoly.view;

import de.hhn.labsw.laspoly.model.field.Field;
import javafx.scene.image.Image;
import javafx.scene.paint.Color;
import javafx.scene.paint.PhongMaterial;
import javafx.scene.text.Font;

/**
 * Constants of the View.
 */
public final class View {
    /**
     * Values and measures for rendering.
     */
    public static final class CanvasMeasures {
        /**
         * Height of the coloured bar on streets.
         */
        public static final double COLOR_BAR_HEIGHT = 2;
        /**
         * @ see{@link #COLOR_BAR_HEIGHT}
         */
        public static final double HALF_COLOR_BAR_HEIGHT = COLOR_BAR_HEIGHT / 2.0;
        /**
         * Depth of the colour bar on a Field.
         */
        public static final double COLOR_BAR_DEPTH = 0.25 * Field.DEPTH;
        /**
         * @ see {@link #COLOR_BAR_DEPTH}
         */
        public static final double HALF_COLOR_BAR_DEPTH = 0.5 * COLOR_BAR_DEPTH;
    }

    /**
     * This class contains Colours for the rendering
     */
    public static final class GeneralColorResource {
        /**
         * Default color for the base of a gamescene.
         */
        public static final Color FIELD_COLOR = Color.GRAY;
        /**
         * Color for a gamescene while the user hovers over it with the mouse.
         */
        public static final Color FIELD_COLOR_HOVER = Color.DARKGRAY;
    }

    /**
     * This class contains Fonts for rendering.
     */
    public static final class Fonts {
        /**
         * Font Size for the gamescene name.
         */
        public static final int FIELD_NAME_SIZE = 12;

        /**
         * creates a new Font with the given size.
         */
        public static Font fieldFont (int size) {
            return Font.font("Arial", size);
        }
    }

    /**
     * This class contains Materials for rendering.
     */
    public static final class Materials {
        /**
         * Default Material for a Field.
         */
        public static final PhongMaterial FIELD_MATERIAL = new PhongMaterial(GeneralColorResource.FIELD_COLOR);
        /**
         * Material that is used to render the base shape of fields while the mouse hovers the gamescene.
         */
        public static final PhongMaterial FIELD_MATERIAL_HOVER = new PhongMaterial(GeneralColorResource.FIELD_COLOR_HOVER);
        public static final PhongMaterial BUILDING_CUBE_MATERIAL,
                FIGURE1_MATERIAL, FIGURE2_MATERIAL, FIGURE3_MATERIAL, FIGURE4_MATERIAL;

        static {
            // initialize Materials
            Image hotel = new Image("de/hhn/labsw/laspoly/view/game/building.jpg");
            Image[] figures = {
                    new Image("de/hhn/labsw/laspoly/view/game/figures/figure1.jpg"),
                    new Image("de/hhn/labsw/laspoly/view/game/figures/figure2.jpg"),
                    new Image("de/hhn/labsw/laspoly/view/game/figures/figure3.jpg"),
                    new Image("de/hhn/labsw/laspoly/view/game/figures/figure4.jpg"),
            };
            BUILDING_CUBE_MATERIAL = new PhongMaterial();
            FIGURE1_MATERIAL = new PhongMaterial();
            FIGURE2_MATERIAL = new PhongMaterial();
            FIGURE3_MATERIAL = new PhongMaterial();
            FIGURE4_MATERIAL = new PhongMaterial();
            BUILDING_CUBE_MATERIAL.setDiffuseMap(hotel);
            FIGURE1_MATERIAL.setDiffuseMap(figures[0]);
            FIGURE2_MATERIAL.setDiffuseMap(figures[1]);
            FIGURE3_MATERIAL.setDiffuseMap(figures[2]);
            FIGURE4_MATERIAL.setDiffuseMap(figures[3]);
        }
    }

    /**
     * Different positions of a {@link de.hhn.labsw.laspoly.model.Figure}.
     */
    public static final class FigurePositions {
        /**
         * Top-Left.
         */
        public static final Integer[] TOP_LEFT = {25, 6};
        /**
         * Top-Right.
         */
        public static final Integer[] TOP_RIGHT = {-25, 6};
        /**
         * Bottom-Left
         */
        public static final Integer[] BOTTOM_LEFT = {25, -45};
        /**
         * Bottom-Right
         */
        public static final Integer[] BOTTOM_RIGHT = {-25, -45};
    }
}
