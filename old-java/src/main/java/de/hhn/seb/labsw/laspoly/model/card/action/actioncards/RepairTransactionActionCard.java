/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card.action.actioncards;

import de.hhn.seb.labsw.laspoly.exception.InvalidActionIdentifierException;
import de.hhn.seb.labsw.laspoly.model.card.action.SingleOptionActionCard;
import java.util.Locale;

public abstract class RepairTransactionActionCard
extends SingleOptionActionCard {
    private final int multiplier;

    public RepairTransactionActionCard(Locale loc, String identifier, int multiplierVal) throws InvalidActionIdentifierException {
        super(loc, identifier);
        this.multiplier = multiplierVal;
        if (!this.getBundle().getString(this.getIdentifier()).contains("%d")) {
            throw new InvalidActionIdentifierException("%d");
        }
    }

    public int getMultiplier() {
        return this.multiplier;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "multiplier=" + this.multiplier + '}';
    }
}

