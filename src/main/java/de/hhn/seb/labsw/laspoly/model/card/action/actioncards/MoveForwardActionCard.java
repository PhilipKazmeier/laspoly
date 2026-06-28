/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card.action.actioncards;

import de.hhn.seb.labsw.laspoly.exception.InvalidActionIdentifierException;
import de.hhn.seb.labsw.laspoly.model.card.action.SingleOptionActionCard;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import java.util.Locale;

public class MoveForwardActionCard
extends SingleOptionActionCard {
    private int distance = -1;

    public MoveForwardActionCard(Locale loc, String identifier) throws InvalidActionIdentifierException {
        super(loc, identifier);
        if (!this.getBundle().getString(this.getIdentifier()).contains("%s")) {
            throw new InvalidActionIdentifierException("%s");
        }
    }

    @Override
    protected void onAction(Figure fig, GameHandler handler) {
        handler.getScene().getPlayerIndicator().hide();
        handler.placeFigure(fig, this.distance);
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "distance=" + this.distance + '}';
    }

    @Override
    protected void prepare(GameHandler handler) {
        this.distance = 5;
        String text = String.format(this.getBundle().getString(this.getIdentifier()), this.distance);
        this.getActionCardText().setText(text);
        this.setValues(this.distance);
    }
}

