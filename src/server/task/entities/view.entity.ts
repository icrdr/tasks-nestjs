import { Column, Entity, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '@server/common/common.entity';
import { Header } from './property.entity';

export enum ViewType {
  TABLE = 'table',
  LIST = 'list',
  CARD = 'card',
}

@Entity()
export class ViewSet extends BaseEntity {
  @OneToMany(() => View, (view) => view.viewSet)
  views: View[];

  @OneToMany(() => Header, (header) => header.viewSet)
  headers: Header[];
}

@Entity()
export class View extends BaseEntity {
  @ManyToOne(() => ViewSet, (viewSet) => viewSet.views)
  viewSet: ViewSet;

  @Column('simple-json', { nullable: true })
  porperties: any;

  @Column('simple-json', { nullable: true })
  sorts: any;

  @Column('simple-json', { nullable: true })
  filters: any;

  @Column('simple-json', { nullable: true })
  options: any;

  @Column({
    type: 'enum',
    enum: ViewType,
  })
  type: ViewType;
}
