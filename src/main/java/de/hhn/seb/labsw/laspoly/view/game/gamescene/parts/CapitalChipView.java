/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.application.Platform
 *  javafx.scene.Group
 *  javafx.scene.Node
 *  javafx.scene.control.Label
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene.parts;

import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameSceneModelSource;
import de.hhn.seb.labsw.laspoly.view.View;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.GameScene;
import de.hhn.seb.labsw.laspoly.view.paint.AbsNodeHolder;
import de.hhn.seb.labsw.laspoly.view.paint.Drawable;
import de.hhn.seb.labsw.laspoly.view.paint.PreviewDrawable;
import java.util.Random;
import java.util.stream.Stream;
import javafx.application.Platform;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.control.Label;

public class CapitalChipView
implements Drawable,
PreviewDrawable {
    private static final GameSceneModelSource[] CHIP_SOURCES = new GameSceneModelSource[]{GameSceneModelSource.CHIP_1_LPD, GameSceneModelSource.CHIP_10_LPD, GameSceneModelSource.CHIP_100_LPD, GameSceneModelSource.CHIP_1000_LPD};
    private final Player player;
    private final NodeHolder nodes;

    public CapitalChipView(Player p) {
        this.player = p;
        this.nodes = new NodeHolder();
        this.player.getCapitalProperty().addListener((observable, oldValue, newValue) -> Platform.runLater(() -> this.nodes.changeChipStack()));
        this.nodes.changeChipStack();
    }

    @Override
    public Node draw() {
        Group group = new Group((Node[])this.nodes.stacksOfChipsGroup);
        group.getChildren().add(this.nodes.labelGroup);
        return group;
    }

    @Override
    public EnhancedGroup drawPreview() {
        return new EnhancedGroup(new Node[]{new Label(this.player.getCapitalProperty().intValue() + " LPD")});
    }

    public class NodeHolder
    implements AbsNodeHolder {
        private final EnhancedGroup[] stacksOfChipsGroup;
        private final Label label;
        private final EnhancedGroup labelGroup;

        public NodeHolder() {
            this.stacksOfChipsGroup = new EnhancedGroup[4];
            this.stacksOfChipsGroup[0] = new EnhancedGroup();
            this.stacksOfChipsGroup[0].setTranslateX(-600.0);
            this.stacksOfChipsGroup[0].setTranslateZ(200.0);
            this.stacksOfChipsGroup[1] = new EnhancedGroup();
            this.stacksOfChipsGroup[1].setTranslateX(-500.0);
            this.stacksOfChipsGroup[1].setTranslateZ(200.0);
            this.stacksOfChipsGroup[2] = new EnhancedGroup();
            this.stacksOfChipsGroup[2].setTranslateX(-600.0);
            this.stacksOfChipsGroup[2].setTranslateZ(300.0);
            this.stacksOfChipsGroup[3] = new EnhancedGroup();
            this.stacksOfChipsGroup[3].setTranslateX(-500.0);
            this.stacksOfChipsGroup[3].setTranslateZ(300.0);
            this.label = new Label();
            this.label.setFont(View.Fonts.fieldFont(30));
            this.label.setStyle("-fx-text-fill: white;");
            this.labelGroup = new EnhancedGroup(new Node[]{this.label});
            this.labelGroup.setRy(180.0);
            this.labelGroup.setRx(90.0);
            this.labelGroup.setTranslateX(-480.0);
            this.labelGroup.setTranslateZ(400.0);
        }

        private void changeChipStack() {
            Stream.of(this.stacksOfChipsGroup).forEach(stack -> stack.getChildren().clear());
            Random r = new Random();
            int[] values = new int[]{1, 10, 100, 1000};
            int valueLeft = CapitalChipView.this.player.getMoneyAmount();
            for (int i = values.length - 1; i >= 0; --i) {
                int y = 0;
                while (valueLeft >= values[i]) {
                    valueLeft -= values[i];
                    EnhancedGroup chip = this.createChip(i);
                    chip.setTranslateX(r.nextInt(2) - 2);
                    chip.setTranslateZ(r.nextInt(2) - 2);
                    chip.setRy(180.0);
                    chip.setTranslateY(y++ * 4);
                    this.stacksOfChipsGroup[i].getChildren().add(chip);
                }
            }
            String myMoney = GameScene.getResources().getString("capital_mycapital");
            myMoney = String.format(myMoney, CapitalChipView.this.player.getMoneyAmount());
            this.label.setText(myMoney);
        }

        private EnhancedGroup createChip(int index) {
            EnhancedGroup chip = DataLoader.getInstance().importGameSceneForm(CHIP_SOURCES[index]);
            chip.setScale(4.0);
            chip.setScaleY(2.0);
            return chip;
        }

        @Override
        public double getBottomHeight() {
            return 0.0;
        }
    }
}

