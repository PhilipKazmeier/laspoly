/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.application.Platform
 *  javafx.geometry.Pos
 *  javafx.scene.Node
 *  javafx.scene.control.Label
 *  javafx.scene.paint.Color
 *  javafx.scene.paint.Material
 *  javafx.scene.paint.Paint
 *  javafx.scene.paint.PhongMaterial
 *  javafx.scene.shape.Box
 *  javafx.scene.text.Font
 *  javafx.scene.text.FontWeight
 *  javafx.scene.text.TextAlignment
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene.parts;

import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.card.AbsCardDeckNodeHolder;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.GameScene;
import de.hhn.seb.labsw.laspoly.view.paint.Drawable;
import java.util.Arrays;
import javafx.application.Platform;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.Label;
import javafx.scene.paint.Color;
import javafx.scene.paint.Material;
import javafx.scene.paint.Paint;
import javafx.scene.paint.PhongMaterial;
import javafx.scene.shape.Box;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.scene.text.TextAlignment;

public class PropertyCardDeck
implements Drawable {
    private final Player player;
    private final NodeHolder nodes;
    private Runnable onMouseClick;

    public PropertyCardDeck(Player p) {
        this.player = p;
        this.nodes = new NodeHolder();
        p.addOnPropertyListChangeListener(e -> {
            this.nodes.setNumCards(p.getPropertyList().size());
            Platform.runLater(this::showCardStackView);
        });
    }

    public void setOnMouseClick(Runnable onMouseClicked) {
        this.onMouseClick = onMouseClicked;
    }

    @Override
    public Node draw() {
        this.showCardStackView();
        return this.nodes.rootGroup;
    }

    private void onMouseClicked() {
        if (this.onMouseClick != null) {
            this.onMouseClick.run();
        }
    }

    public void showCardStackView() {
        this.nodes.rootGroup.getChildren().clear();
        this.nodes.rootGroup.getChildren().addAll(this.nodes.getCards());
        this.nodes.rootGroup.getChildren().add(this.nodes.labelGroup);
        this.nodes.updateLabel();
        if (this.player.getPropertyList().isEmpty()) {
            this.nodes.labelGroup.setOpacity(0.0);
        } else {
            this.nodes.labelGroup.setOpacity(1.0);
        }
    }

    public Player getPlayer() {
        return this.player;
    }

    public class NodeHolder
    extends AbsCardDeckNodeHolder {
        private final PhongMaterial cardMaterial;
        private final PhongMaterial cardMaterialHover;
        private final EnhancedGroup labelGroup;
        private final Label label;
        private final EnhancedGroup rootGroup;

        public NodeHolder() {
            super(0, 200, 100);
            this.rootGroup = new EnhancedGroup();
            this.cardMaterial = de.hhn.seb.labsw.laspoly.view.paint.Material.textured(DataLoader.getInstance().getGameImage(GameImage.PROPERTY_CARD_BACK));
            this.cardMaterialHover = de.hhn.seb.labsw.laspoly.view.paint.Material.textured(DataLoader.getInstance().getGameImage(GameImage.PROPERTY_CARD_BACK));
            this.labelGroup = new EnhancedGroup();
            this.label = PropertyCardDeck.this.player.getUser() == null ? new Label(String.format(GameScene.getResources().getString("gamescene_mycards"), "Debugger")) : new Label(String.format(GameScene.getResources().getString("gamescene_mycards"), PropertyCardDeck.this.player.getUser().getName()));
            this.labelGroup.getChildren().add(this.label);
            this.label.setTextAlignment(TextAlignment.CENTER);
            this.label.setAlignment(Pos.CENTER);
            this.label.setPrefWidth(200.0);
            this.label.setMinWidth(200.0);
            this.label.setPrefHeight(100.0);
            this.label.setMinHeight(100.0);
            this.labelGroup.setRx(90.0);
            this.label.setRotate(180.0);
            this.labelGroup.setOnMouseEntered(e -> this.onHoverStart());
            this.labelGroup.setOnMouseExited(e -> this.onHoverEnd());
            this.labelGroup.setOnMouseClicked(e -> PropertyCardDeck.this.onMouseClicked());
            this.label.setTextFill((Paint)Color.BLACK);
            this.label.setFont(Font.font((String)this.label.getFont().getFamily(), (FontWeight)FontWeight.BOLD, (double)20.0));
        }

        @Override
        public void setNumCards(int numCards) {
            super.setNumCards(numCards);
            Arrays.stream(this.getCards()).forEach(card -> {
                card.setMaterial((Material)this.cardMaterial);
                card.setOnMouseEntered(e -> this.onHoverStart());
                card.setOnMouseExited(e -> this.onHoverEnd());
                card.setOnMouseClicked(e -> PropertyCardDeck.this.onMouseClicked());
            });
            this.updateLabel();
        }

        public void updateLabel() {
            Box upperCard = this.getUppermostCard();
            if (upperCard != null) {
                this.labelGroup.setTz(upperCard.getTranslateZ() - 50.0);
                this.labelGroup.setTx(upperCard.getTranslateX() - 100.0);
                this.labelGroup.setTranslateY(upperCard.getTranslateY() + 4.0);
                this.labelGroup.setOpacity(1.0);
            } else if (this.labelGroup != null) {
                this.labelGroup.setOpacity(0.0);
            }
        }

        private void onHoverEnd() {
            this.label.setTextFill((Paint)Color.BLACK);
        }

        private void onHoverStart() {
            this.label.setTextFill((Paint)Color.BLUE);
        }
    }
}

