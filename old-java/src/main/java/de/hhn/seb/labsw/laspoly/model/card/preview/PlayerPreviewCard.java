/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.geometry.Insets
 *  javafx.scene.layout.AnchorPane
 *  javafx.scene.layout.Background
 *  javafx.scene.layout.BackgroundFill
 *  javafx.scene.layout.CornerRadii
 *  javafx.scene.paint.Color
 *  javafx.scene.paint.Paint
 */
package de.hhn.seb.labsw.laspoly.model.card.preview;

import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.card.ActionMenuCard;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import java.util.ResourceBundle;
import javafx.geometry.Insets;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.Background;
import javafx.scene.layout.BackgroundFill;
import javafx.scene.layout.CornerRadii;
import javafx.scene.paint.Color;
import javafx.scene.paint.Paint;

public class PlayerPreviewCard
extends ActionMenuCard {
    private final Player player;

    public PlayerPreviewCard(Player p) {
        this.player = p;
        this.setNodeHolder(new NodeHolder());
    }

    public Player getPlayer() {
        return this.player;
    }

    @Override
    public EnhancedGroup drawPreview() {
        ((NodeHolder)this.getNodeHolder()).adjustColor();
        return super.drawPreview();
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "player=" + this.player + '}';
    }

    public class NodeHolder
    extends ActionMenuCard.NodeHolder {
        public NodeHolder() {
            super(FXMLFile.PREVIEW_PLAYER);
            this.lookUpLabels("#namelabel", "#moneylabel", "#infolabel1");
        }

        private void adjustColor() {
            AnchorPane pane = (AnchorPane)this.getLayout().lookup("#namePane");
            pane.setBackground(new Background(new BackgroundFill[]{new BackgroundFill((Paint)PlayerPreviewCard.this.player.getColor(), CornerRadii.EMPTY, Insets.EMPTY)}));
            if (PlayerPreviewCard.this.player.getColor().equals(Color.BLACK) || PlayerPreviewCard.this.player.getColor().equals(Color.BLUE) || PlayerPreviewCard.this.player.getColor().equals(Color.GREEN) || PlayerPreviewCard.this.player.getColor().equals(Color.GREY) || PlayerPreviewCard.this.player.getColor().equals(Color.BROWN)) {
                this.label(0).setTextFill((Paint)Color.WHITE);
            }
        }

        @Override
        protected void updateLabelTexts(ResourceBundle res) {
            super.updateLabelTexts(res);
            String playername = PlayerPreviewCard.this.player.getUser().getName();
            this.label(0).setText(playername);
            this.update(this.label(1), res, "playerpreview_money", PlayerPreviewCard.this.player.getCapitalProperty().intValue());
            this.update(this.label(2), res, "playerpreview_info1", playername, PlayerPreviewCard.this.player.getPropertyList().size());
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

