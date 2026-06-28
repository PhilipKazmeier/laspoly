package de.hhn.labsw.laspoly.model;

import de.hhn.labsw.laspoly.model.field.Field;
import de.hhn.labsw.laspoly.utils.Xform;
import de.hhn.labsw.laspoly.view.View;
import de.hhn.labsw.laspoly.view.game.gamescene.Board;
import de.hhn.labsw.laspoly.view.paint.Drawable;
import javafx.scene.DepthTest;
import javafx.scene.Node;
import javafx.scene.paint.Material;
import javafx.scene.shape.Cylinder;
import javafx.scene.text.Font;
import javafx.scene.text.Text;

/**
 * This class represents the figure of the {@link de.hhn.labsw.laspoly.model.User} playing a {@link
 * de.hhn.labsw.laspoly.model.Game}.
 */
public class Figure implements Drawable {

    /**
     * {@link de.hhn.labsw.laspoly.model.User} of this {@link de.hhn.labsw.laspoly.model.Figure}.
     */
    private User user;

    /**
     * {@link javafx.scene.shape.Cylinder} that is representing the {@link de.hhn.labsw.laspoly.model.Figure}.
     */
    private Cylinder figure1;

    /**
     * {@link de.hhn.labsw.laspoly.utils.Xform} containing all parts of the figure.
     */
    private Xform figure = new Xform();

    /**
     * {@link de.hhn.labsw.laspoly.model.field.Field} the {@link de.hhn.labsw.laspoly.model.Figure} is on.
     */
    private Field field = null;

    /**
     * Font of the hover name of the {@link de.hhn.labsw.laspoly.model.User} of this {@link
     * de.hhn.labsw.laspoly.model.Figure}.
     */
    public static final Font FONT_NAME = View.Fonts.fieldFont(View.Fonts.FIELD_NAME_SIZE);

    /**
     * Hover text of the {@link de.hhn.labsw.laspoly.model.User} of this {@link de.hhn.labsw.laspoly.model.Figure}.
     */
    private Text text;

    /**
     * Constructor.
     *
     * @param figureUser {@link de.hhn.labsw.laspoly.model.User} of this {@link de.hhn.labsw.laspoly.model.Figure}.
     * @param side       {@link javafx.scene.paint.Material} that the {@link #figure} should look on the side.
     */
    public Figure (User figureUser, Material side) {
        user = figureUser;
        figure1 = new Cylinder(12, 40);
        figure1.setRotate(180);
        figure1.setMaterial(side);

        text = new Text(user.getName());
        text.setTranslateY(50);
        text.setTranslateX(-10);    // TODO muss man jedes mal anpassen wenn Textgröße sich ändert
        text.setFont(FONT_NAME);
        text.setRotate(180);
        text.setVisible(false);
        figure.getChildren().addAll(figure1, text);
        figure.setDepthTest(DepthTest.ENABLE);

    }

    /**
     * @return {@link #user}.
     */
    public User getUser () {
        return user;
    }

    /**
     * @return {@link #figure}.
     */
    public Xform getFigure () {
        return figure;
    }

    /**
     * Changes the position of the figure.
     *
     * @param fieldOfFigure The {@link de.hhn.labsw.laspoly.model.field.Field} the figure moves to.
     */
    public void placeFigure (Field fieldOfFigure) {
        if (this.field != null) {
            this.field.getFigureList().remove(this);
            int oldFieldFigureCount = this.field.getFigureList().size();
            if (oldFieldFigureCount == 1) {  // One other figure on the gamescene
                field.getFigureList().get(0).updatePosition(View.FigurePositions.TOP_LEFT);
            } else if (oldFieldFigureCount == 2) {  // Two other figures on the gamescene
                field.getFigureList().get(0).updatePosition(View.FigurePositions.TOP_LEFT);
                field.getFigureList().get(1).updatePosition(View.FigurePositions.BOTTOM_RIGHT);
            } else if (oldFieldFigureCount == 3) {  // Three other figures on the gamescene
                field.getFigureList().get(0).updatePosition(View.FigurePositions.TOP_LEFT);
                field.getFigureList().get(1).updatePosition(View.FigurePositions.TOP_RIGHT);
                field.getFigureList().get(2).updatePosition(View.FigurePositions.BOTTOM_LEFT);
            }
        }
        this.field = fieldOfFigure;
        int figureCount = fieldOfFigure.getFigureList().size();


        figure.setTranslateZ(getInitialZ(fieldOfFigure));
        figure.setTranslateX(getInitialX(fieldOfFigure));

        if (figureCount == 1) {  // One other figure on the gamescene
            fieldOfFigure.getFigureList().get(0).updatePosition(View.FigurePositions.TOP_LEFT);
            updatePosition(View.FigurePositions.BOTTOM_RIGHT);
        } else if (figureCount == 2) {  // Two other figures on the gamescene
            fieldOfFigure.getFigureList().get(0).updatePosition(View.FigurePositions.TOP_LEFT);
            fieldOfFigure.getFigureList().get(1).updatePosition(View.FigurePositions.TOP_RIGHT);
            updatePosition(View.FigurePositions.BOTTOM_LEFT);
        } else if (figureCount == 3) {  // Three other figures on the gamescene
            fieldOfFigure.getFigureList().get(0).updatePosition(View.FigurePositions.TOP_LEFT);
            fieldOfFigure.getFigureList().get(1).updatePosition(View.FigurePositions.TOP_RIGHT);
            fieldOfFigure.getFigureList().get(2).updatePosition(View.FigurePositions.BOTTOM_LEFT);
            updatePosition(View.FigurePositions.BOTTOM_RIGHT);
        }
        field.getFigureList().add(this);
    }


    /**
     * Updates the position of the {@link de.hhn.labsw.laspoly.model.Figure} on the {@link #field}.
     *
     * @param position {@link de.hhn.labsw.laspoly.view.View.FigurePositions}.
     */
    public void updatePosition (Integer[] position) {
        figure.setTranslateX(getInitialX(field) + position[0]);
        figure.setTranslateZ(getInitialZ(field) + position[1]);
    }

    /**
     * Calculates the initial X position.
     *
     * @param fieldOfFigure {@link de.hhn.labsw.laspoly.model.field.Field} the {@link de.hhn.labsw.laspoly.model.Figure}
     *                      is placed on.
     *
     * @return Initial x position.
     */
    private double getInitialX (Field fieldOfFigure) {
        int pos = fieldOfFigure.getPosition();
        double fieldTransX = Board.getFieldOffsetX(pos);
        return (pos == 0 || pos == 30) ? fieldTransX - 25 : pos == 10 ? fieldTransX + 25 : fieldTransX;
    }

    /**
     * Calculates the initial Z position.
     *
     * @param fieldOfFigure {@link de.hhn.labsw.laspoly.model.field.Field} the {@link de.hhn.labsw.laspoly.model.Figure}
     *                      is placed on.
     *
     * @return Initial z position.
     */
    private double getInitialZ (Field fieldOfFigure) {
        int pos = fieldOfFigure.getPosition();
        double fieldTransZ = Board.getFieldOffsetZ(pos);
        return pos == 20 ? fieldTransZ + 25 : fieldTransZ;
    }

    @Override
    public Node draw() {
        figure.setTranslateY(Field.HEIGHT + 15);
        figure.setOnMouseEntered(e -> onHoverStart());
        figure.setOnMouseExited(e -> onHoverEnd());
        return figure;
    }


    /**
     * Called when hovering of {@link #text} is started.
     */
    private void onHoverStart () {
        text.setVisible(true);
    }

    /**
     * Called when hovering of {@link #text} is started.
     */
    private void onHoverEnd () {
        text.setVisible(false);
    }

    /**
     * @return {@link #text}.
     */
    public Text getText () {
        return text;
    }
}
