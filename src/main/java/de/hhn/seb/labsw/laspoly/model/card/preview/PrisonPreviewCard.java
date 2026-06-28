/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card.preview;

import de.hhn.seb.labsw.laspoly.model.card.ActionMenuCard;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.Prison;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import java.util.ResourceBundle;

public class PrisonPreviewCard
extends ActionMenuCard {
    private final Prison prison;

    public PrisonPreviewCard(Prison p) {
        this.prison = p;
        this.setNodeHolder(new NodeHolder());
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "prison=" + this.prison + '}';
    }

    public class NodeHolder
    extends ActionMenuCard.NodeHolder {
        public NodeHolder() {
            super(FXMLFile.PREVIEW_PRISON);
            this.lookUpLabels("#namelabel", "#descriptionlabel", "#pricelabel", "#pricevaluelabel", "#infolabel");
        }

        @Override
        protected void updateLabelTexts(ResourceBundle res) {
            super.updateLabelTexts(res);
            this.label(0).setText(res.getString("prison_name"));
            this.label(1).setText(String.format(res.getString("prison_people_inside"), PrisonPreviewCard.this.prison.getFigureList().size()));
            this.label(2).setText(res.getString("prison_ransom"));
            this.label(3).setText("50 LPD");
            this.label(4).setText(res.getString("carddescription_prison"));
        }

        @Override
        protected int[] getLabelsFromInterest() {
            return new int[0];
        }

        @Override
        public String toString() {
            return this.getClass().getName() + "{}";
        }
    }
}

