package de.hhn.labsw.laspoly.view.game.gamescene;

import de.hhn.labsw.laspoly.model.Figure;
import de.hhn.labsw.laspoly.model.User;
import de.hhn.labsw.laspoly.model.field.Field;
import de.hhn.labsw.laspoly.model.field.FieldConfiguration;
import de.hhn.labsw.laspoly.model.field.specialfield.SpecialField;
import de.hhn.labsw.laspoly.utils.Xform;
import de.hhn.labsw.laspoly.view.View;
import de.hhn.labsw.laspoly.view.paint.Drawable;
import de.hhn.labsw.laspoly.view.paint.Material;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.shape.Box;

import java.util.Locale;

/**
 * TODO fully implement drawable interface
 * The Board is basically the rectangular 3D shape containing all fields and figures.
 */
public class Board implements Drawable {
    /**
     * the 3D height in the window.
     */
    public static final double HEIGHT = 15;
    /**
     * Size of one edge of the board (the board is always quadratic).
     */
    public static final double EDGE_LENGTH = 9*Field.WIDTH + 2* SpecialField.WIDTH;
    /**
     * @see {@link #EDGE_LENGTH}
     */
    public static final double HALF_EDGE_LENGTH = EDGE_LENGTH / 2.0;
    /**
     * List of all fields that are located on the board.
     */
    private Field[] fields;
    /**
     * Array of figures that are locate on the board.
     */
    private Figure[] figures = new Figure[4];

    /**
     * Crates a new board and puts 40 fields on it.
     */
    public Board() {
         /* PLEASE DO NOT CHANGE ANYTHING ON THE FOLLOWING BLOCK    */
        User user = new User("Test", Locale.GERMAN,0);
        fields = FieldConfiguration.FIELDS;
        figures[0] = new Figure(user, View.Materials.FIGURE1_MATERIAL);
        figures[1] = new Figure(user, View.Materials.FIGURE2_MATERIAL);
        figures[2] = new Figure(user, View.Materials.FIGURE3_MATERIAL);
        figures[3] = new Figure(user, View.Materials.FIGURE4_MATERIAL);

        figures[0].placeFigure(fields[0]);
        figures[1].placeFigure(fields[0]);
        figures[2].placeFigure(fields[0]);
        figures[3].placeFigure(fields[0]);

        /* END */

    }

    /**
     * Positions a game gamescene at the correct position in the fitting angle on the board
     */
    private  Xform positionOnBoard(Node field, int pos) {
        Xform group = new Xform();
        group.getChildren().add(field);
        group.setRotateY(getFieldAngle(pos));
        if (isSpecialField(pos)) {
            double[] coordsXZ = getCornerCoords(pos / 10);
            group.setTx((coordsXZ[0]));
            group.setTz(coordsXZ[1]);
        } else {
            group.setTx(getFieldOffsetX(pos));
            group.setTz(getFieldOffsetZ(pos));
        }
        return group;
    }

    /**
     * @param cornerIndex the index of the corner on the game board (0..3)
     *                    return the x and z position of one of the 4 corner fields on the game board.
     */
    public static double[] getCornerCoords(int cornerIndex) {
        return cornerIndex == 0 ? new double[]{-HALF_EDGE_LENGTH + SpecialField.HALF_WIDTH, -HALF_EDGE_LENGTH + SpecialField.HALF_DEPTH}
                : cornerIndex == 1 ? new double[]{HALF_EDGE_LENGTH - SpecialField.HALF_WIDTH, HALF_EDGE_LENGTH - SpecialField.HALF_DEPTH}
                : cornerIndex == 2 ? new double[]{HALF_EDGE_LENGTH - SpecialField.HALF_WIDTH, -HALF_EDGE_LENGTH + SpecialField.HALF_DEPTH}
                :/*     index == 3 */new double[]{-HALF_EDGE_LENGTH + SpecialField.HALF_WIDTH, HALF_EDGE_LENGTH - SpecialField.HALF_DEPTH};
    }

    /**
     * return true if the gamescene at the specified index is a special gamescene (a corner gamescene); false otherwise.
     */
    public static boolean isSpecialField(int pos) {
        return pos == 0 || pos % 10 == 0;
    }

    /**
     * returns the translation on the z axes for the purpose of positioning a gamescene on the board.
     * for example the gamescene with the index 0 is positioned at the lower right corner when viewing
     * the board at an angle of 90°
     *
     * @param pos the index of the game gamescene.
     * @return the translation value for the z direction.
     */
    public static double getFieldOffsetZ(int pos) {
        if (pos < -1 || pos > 39) throw new IllegalArgumentException();
        return pos <= 10 ? -HALF_EDGE_LENGTH + Field.HALF_DEPTH
                : pos <= 20 ? -HALF_EDGE_LENGTH + (pos - 10) * Field.WIDTH - Field.HALF_WIDTH + SpecialField.WIDTH
                : pos <= 30 ? HALF_EDGE_LENGTH - Field.HALF_DEPTH
                :/*pos <= 40*/HALF_EDGE_LENGTH - (pos - 30) * Field.WIDTH + Field.HALF_WIDTH - SpecialField.WIDTH;
    }

    /**
     * returns the translation on the x axes for the purpose of positioning a gamescene on the board.
     * for example the gamescene with the index 0 is positioned at the lower right corner when viewing
     * the board at an angle of 90°
     *
     * @param pos the inex of the gamescene
     * @return the translation value for the x direction.
     */
    public static double getFieldOffsetX(int pos) {
        if (pos < -1 || pos > 39) throw new IllegalArgumentException();
        return pos <= 10 ? -HALF_EDGE_LENGTH + pos * Field.WIDTH - Field.HALF_WIDTH + SpecialField.WIDTH
                : pos <= 20 ? HALF_EDGE_LENGTH - Field.HALF_DEPTH
                : pos <= 30 ? HALF_EDGE_LENGTH - (pos - 20) * Field.WIDTH + Field.HALF_WIDTH - SpecialField.WIDTH
                : -HALF_EDGE_LENGTH + Field.HALF_DEPTH;
    }

    /**
     * Returns the angle. Basically there are four directions of fields.
     *
     * @param pos the index of the game gamescene.
     * @return the angle of the row in which the gamescene is located. This is one of 0, 90, 180, 270 degrees.
     */
    public static int getFieldAngle(int pos) {
        if (pos < -1 || pos > 39) throw new IllegalArgumentException();
        return pos <= 10 ? 0
                : pos <= 20 ? 270
                : pos <= 30 ? 180
                : 90;
    }

    @Override
    public Node draw() {
        Xform graphicsGroup = new Xform();
        Box board = new Box(EDGE_LENGTH, HEIGHT, EDGE_LENGTH);
        board.setCache(true);
        board.setMaterial(Material.GREEN);
        board.setTranslateY(-HEIGHT / 2.0);
        graphicsGroup.getChildren().add(board);

        for (Field field : fields) {
            final Node shape = field.draw();
            Group s = positionOnBoard(shape,field.getPosition());
            graphicsGroup.getChildren().add(s);
        }
        for (Figure figure : figures) {
            graphicsGroup.getChildren().add(figure.draw());
        }
        return graphicsGroup;
    }

    /**
     * return list of figures that are currently located on the board.
     */
    public Figure[] getFigures() {
        return figures;
    }
}
