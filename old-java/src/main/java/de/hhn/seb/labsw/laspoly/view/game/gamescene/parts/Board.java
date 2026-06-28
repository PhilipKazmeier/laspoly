/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Group
 *  javafx.scene.Node
 *  javafx.scene.paint.Material
 *  javafx.scene.paint.PhongMaterial
 *  javafx.scene.shape.Box
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene.parts;

import de.hhn.seb.labsw.laspoly.exception.InvalidParameterException;
import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.card.action.ActionCardDeck;
import de.hhn.seb.labsw.laspoly.model.field.Field;
import de.hhn.seb.labsw.laspoly.model.field.FieldConfiguration;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.view.game.GameController;
import de.hhn.seb.labsw.laspoly.view.paint.Drawable;
import java.util.Collection;
import java.util.HashMap;
import java.util.Locale;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.paint.Material;
import javafx.scene.paint.PhongMaterial;
import javafx.scene.shape.Box;

public class Board
implements Drawable {
    public static final double HEIGHT = 2.0;
    public static final double EDGE_LENGTH = 1200.0;
    public static final double HALF_EDGE_LENGTH = 600.0;
    private final Field[] fields;
    private final ActionCardDeck cardDeck;
    private final HashMap<Player, Figure> figures;
    private final GameController controller;
    private final EnhancedGroup graphicsGroup = new EnhancedGroup();

    public Board(HashMap<Player, Figure> figureList, Locale loc, GameController gameController) {
        this.cardDeck = new ActionCardDeck(loc);
        this.fields = FieldConfiguration.getFields();
        this.figures = figureList;
        this.controller = gameController;
    }

    public static double[] getCornerCoords(int cornerIndex) {
        switch (cornerIndex) {
            case 0: {
                return new double[]{-525.0, -525.0};
            }
            case 1: {
                return new double[]{525.0, -525.0};
            }
            case 2: {
                return new double[]{525.0, 525.0};
            }
        }
        return new double[]{-525.0, 525.0};
    }

    public static boolean isSpecialField(int pos) {
        return pos == 0 || pos % 10 == 0;
    }

    public static double getFieldOffsetZ(int pos) {
        if (pos < 0 || pos > 40) {
            throw new InvalidParameterException("The given position should be between 0 and 40.", "pos", pos);
        }
        if (pos == 40) {
            return 0.0;
        }
        if (pos <= 10) {
            return -525.0;
        }
        if (pos <= 20) {
            return -600.0 + (double)(pos - 10) * 100.0 - 50.0 + 150.0;
        }
        if (pos <= 30) {
            return 525.0;
        }
        return 600.0 - (double)(pos - 30) * 100.0 + 50.0 - 150.0;
    }

    public static double getFieldOffsetX(int pos) {
        if (pos < 0 || pos > 40) {
            throw new InvalidParameterException("The given position should be between 0 and 40.", "pos", pos);
        }
        if (pos == 40) {
            return 0.0;
        }
        if (pos <= 10) {
            return -600.0 + (double)pos * 100.0 - 50.0 + 150.0;
        }
        if (pos <= 20) {
            return 525.0;
        }
        if (pos <= 30) {
            return 600.0 - (double)(pos - 20) * 100.0 + 50.0 - 150.0;
        }
        return -525.0;
    }

    public static int getFieldAngle(int pos) {
        if (pos < 0 || pos > 40) {
            throw new InvalidParameterException("The given position should be between 0 and 40.", "pos", pos);
        }
        if (pos <= 10) {
            return 0;
        }
        if (pos <= 20) {
            return 270;
        }
        if (pos <= 30) {
            return 180;
        }
        return 90;
    }

    public void removeFigure(Figure fig) {
        this.graphicsGroup.getChildren().remove(fig.draw());
    }

    private EnhancedGroup positionOnBoard(Node field, int pos) {
        if (pos == 40) {
            EnhancedGroup prisonGroup = new EnhancedGroup();
            prisonGroup.getChildren().add(field);
            return prisonGroup;
        }
        EnhancedGroup group = new EnhancedGroup();
        group.getChildren().add(field);
        group.setRy(Board.getFieldAngle(pos));
        if (Board.isSpecialField(pos)) {
            double[] coordsXZ = Board.getCornerCoords(pos / 10);
            group.setTx(coordsXZ[0]);
            group.setTz(coordsXZ[1]);
        } else {
            group.setTx(Board.getFieldOffsetX(pos));
            group.setTz(Board.getFieldOffsetZ(pos));
        }
        return group;
    }

    @Override
    public Node draw() {
        Box board = new Box(1200.0, 2.0, 1200.0);
        PhongMaterial mat = de.hhn.seb.labsw.laspoly.view.paint.Material.textured(DataLoader.getInstance().getGameImage(GameImage.TEXTURE_BOARD));
        board.setMaterial((Material)mat);
        board.setTranslateY(-1.0);
        this.graphicsGroup.getChildren().add(board);
        for (Field field : this.fields) {
            Group shape = field.draw();
            EnhancedGroup s = this.positionOnBoard((Node)shape, field.getPosition());
            this.graphicsGroup.getChildren().add(s);
        }
        for (Figure figure : this.figures.values()) {
            figure.draw().setVisible(false);
            figure.placeFigure(this.fields[0], () -> figure.draw().setVisible(true), Figure.FigureAnimation.ANIM_DRAW);
            this.graphicsGroup.getChildren().add(figure.draw());
        }
        EnhancedGroup cardDeckGroup = new EnhancedGroup();
        cardDeckGroup.getChildren().add(this.cardDeck.draw());
        cardDeckGroup.setRy(45.0);
        cardDeckGroup.setTranslateX(240.0);
        cardDeckGroup.setTranslateZ(240.0);
        this.graphicsGroup.getChildren().add(cardDeckGroup);
        return this.graphicsGroup;
    }

    public Collection<Figure> getFigures() {
        return this.figures.values();
    }

    public Field[] getFields() {
        return this.fields;
    }

    public ActionCardDeck getCardDeck() {
        return this.cardDeck;
    }

    public void setupActionCardDeck() {
        this.cardDeck.generateActionCards(this.controller);
    }
}

