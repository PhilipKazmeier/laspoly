package de.hhn.labsw.laspoly.model.action;

import de.hhn.labsw.laspoly.model.Figure;
import de.hhn.labsw.laspoly.model.field.Field;

/**
 * Action that moves the {@link de.hhn.labsw.laspoly.model.Figure} of the {@link de.hhn.labsw.laspoly.model.Player} on
 * the {@link de.hhn.labsw.laspoly.view.game.gamescene.Board}.
 */
public class Move implements Action {

    /**
     * Figure that will be moved.
     */
    private Figure figure;

    /**
     * Field the figure will be moved on.
     */
    private Field target;

    /**
     * Constructor.
     *
     * @param figure   Figure that will be moved.
     * @param distance Distance the figure will be moved.
     */
    public Move(Figure figure, int distance) {
        this.figure = figure;
        target = null; // TODO
    }

    /**
     * Constructor.
     *
     * @param figure      Figure that will be moved.
     * @param targetField Field the figure will be moved on.
     */
    public Move(Figure figure, Field targetField) {
        this.figure = figure;
        target = targetField;
    }

    @Override
    public void onAction() {
        figure.placeFigure(target);
    }

    @Override
    public boolean isActionValid() {
        return target != null;
    }
}
