
import React from 'react';
import { Chip } from '@mui/material';
import { appConfig } from '../config/appConfig';

interface XenTagChipProps {
  tag: string;
  index?: number;
}

const xenRegex = /^Xen-\d+$/i;

export const XenTagChip: React.FC<XenTagChipProps> = ({ tag, index }) => {
  const isXenTag = xenRegex.test(tag);
  if (isXenTag) {
    const jiraUrl = `https://${appConfig.jiraHost}/browse/${tag.toLowerCase()}`;
    return (
      <a
        key={index}
        href={jiraUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        style={{ textDecoration: 'none' }}
      >
        <Chip
          label={tag}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.75rem', cursor: 'pointer', color: '#1976d2', borderColor: '#1976d2' }}
        />
      </a>
    );
  }
  return (
    <Chip
      key={index}
      label={tag}
      size="small"
      variant="outlined"
      sx={{ fontSize: '0.75rem' }}
    />
  );
};
