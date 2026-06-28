/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card.action.actioncards;

import de.hhn.seb.labsw.laspoly.model.card.action.SingleOptionActionCard;
import de.hhn.seb.labsw.laspoly.model.field.Field;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.SpecialField;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import java.util.Locale;

public class MoveActionCard
extends SingleOptionActionCard {
    private final boolean preSet;
    private Field field;

    public MoveActionCard(Locale loc) {
        super(loc, "move");
        this.preSet = false;
    }

    public MoveActionCard(Locale loc, Field fieldTo) {
        super(loc, "move");
        this.field = fieldTo;
        this.preSet = true;
    }

    public MoveActionCard(Locale loc, String identifier, Field fieldTo) {
        super(loc, identifier);
        this.field = fieldTo;
        this.preSet = true;
    }

    @Override
    protected void prepare(GameHandler handler) {
        String text;
        if (!this.preSet) {
            do {
                this.field = handler.getField((int)(Math.random() * 40.0));
            } while (this.field instanceof SpecialField);
        }
        if (this.getIdentifier().equals("jail")) {
            text = this.getBundle().getString(this.getIdentifier());
            handler.setDiceActive(false);
        } else {
            text = String.format(this.getBundle().getString(this.getIdentifier()), this.field.getName());
        }
        this.getActionCardText().setText(text);
        this.setValues(this.field.getName());
    }

    @Override
    protected void onAction(Figure fig, GameHandler handler) {
        handler.getScene().getPlayerIndicator().hide();
        handler.disableFinishTurn();
        handler.placeFigure(fig, this.field);
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "preSet=" + this.preSet + ", field=" + String.valueOf(this.field) + '}';
    }
}

