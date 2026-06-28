/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card.action.actioncards;

import de.hhn.seb.labsw.laspoly.model.card.action.SingleOptionActionCard;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import java.util.Locale;

public class MoveToNextTrainStationActionCard
extends SingleOptionActionCard {
    public MoveToNextTrainStationActionCard(Locale loc) {
        super(loc, "nextTrainStation");
    }

    @Override
    protected void onAction(Figure fig, GameHandler handler) {
        handler.getScene().getPlayerIndicator().hide();
        int pos = fig.getField().getPosition();
        if (pos < 5 || pos >= 35) {
            handler.placeFigure(fig.getUser(), 5);
        } else if (pos < 15) {
            handler.placeFigure(fig.getUser(), 15);
        } else if (pos < 25) {
            handler.placeFigure(fig.getUser(), 25);
        } else {
            handler.placeFigure(fig.getUser(), 35);
        }
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{}";
    }

    @Override
    protected void prepare(GameHandler handler) {
        this.getActionCardText().setText(this.getBundle().getString(this.getIdentifier()));
    }
}

